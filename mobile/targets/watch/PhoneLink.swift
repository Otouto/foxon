import Foundation
import WatchConnectivity

/// Watch-side WCSession wrapper. The iPhone pushes ACTIVE workouts through
/// applicationContext (latest snapshot wins, persisted here so the list works
/// offline). Finished sessions go back via transferUserInfo, which is queued
/// by the system and survives the phone being unreachable or the watch
/// rebooting — delivery happens whenever the devices reconnect.
final class PhoneLink: NSObject, ObservableObject, WCSessionDelegate {
    static let shared = PhoneLink()

    @Published var workouts: [WatchWorkout] = []
    @Published var isReachable = false

    private static let contextKey = "foxon.watch.lastContextJSON"

    private override init() {
        super.init()
        if let cached = UserDefaults.standard.string(forKey: Self.contextKey) {
            decodeEnvelope(json: cached)
        }
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    func sendCompletedSession(json: String) {
        let payload: [String: Any] = [
            "type": "session.complete",
            "json": json,
            "sentAt": Date().timeIntervalSince1970,
        ]
        WCSession.default.transferUserInfo(payload)
    }

    // MARK: - WCSessionDelegate

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
            self.readContext(session.receivedApplicationContext)
        }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        DispatchQueue.main.async {
            self.readContext(applicationContext)
        }
    }

    private func readContext(_ context: [String: Any]) {
        guard let json = context["json"] as? String else { return }
        UserDefaults.standard.set(json, forKey: Self.contextKey)
        decodeEnvelope(json: json)
    }

    private func decodeEnvelope(json: String) {
        guard let data = json.data(using: .utf8),
              let envelope = try? JSONDecoder().decode(WatchSyncEnvelope.self, from: data)
        else { return }
        workouts = envelope.workouts
    }
}
