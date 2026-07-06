import Foundation
import WatchConnectivity

/// Watch-side WCSession wrapper. Receives the applicationContext pushed by the
/// iPhone app and queues payloads back via transferUserInfo, which survives the
/// phone being unreachable and delivers whenever the devices reconnect.
final class PhoneLink: NSObject, ObservableObject, WCSessionDelegate {
    static let shared = PhoneLink()

    @Published var contextJSON: String?
    @Published var isReachable = false
    @Published var lastSendStatus: String?

    private override init() {
        super.init()
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    func ping() {
        let payload: [String: Any] = [
            "type": "ping",
            "json": "{\"hello\":\"from watch\"}",
            "sentAt": Date().timeIntervalSince1970,
        ]
        WCSession.default.transferUserInfo(payload)
        let queued = WCSession.default.outstandingUserInfoTransfers.count
        DispatchQueue.main.async {
            self.lastSendStatus = "Queued (\(queued) pending)"
        }
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
        guard !context.isEmpty else { return }
        contextJSON = context["json"] as? String ?? String(describing: context)
    }
}
