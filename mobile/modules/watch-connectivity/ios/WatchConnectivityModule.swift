import ExpoModulesCore
import WatchConnectivity

public class WatchConnectivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WatchConnectivity")

    Events("onUserInfoReceived")

    OnCreate {
      WatchLink.shared.activate()
    }

    OnStartObserving {
      WatchLink.shared.onNewUserInfo = { [weak self] in
        self?.sendEvent("onUserInfoReceived")
      }
      // Payloads may have arrived before JS attached its listener
      if WatchLink.shared.hasPendingUserInfo {
        self.sendEvent("onUserInfoReceived")
      }
    }

    OnStopObserving {
      WatchLink.shared.onNewUserInfo = nil
    }

    Property("isSupported") {
      WCSession.isSupported()
    }

    AsyncFunction("getState") { () -> [String: Any] in
      WatchLink.shared.state
    }

    AsyncFunction("updateApplicationContext") { (context: [String: Any]) in
      try WatchLink.shared.updateApplicationContext(context)
    }

    AsyncFunction("consumePendingUserInfo") { () -> [[String: Any]] in
      WatchLink.shared.consumePendingUserInfo()
    }
  }
}

/// Phone-side WCSession owner. Incoming userInfo transfers are appended to a
/// UserDefaults-backed queue before JS is notified, so payloads delivered
/// while React Native is not yet running (background launch, cold start) are
/// never lost; JS drains the queue with consumePendingUserInfo().
final class WatchLink: NSObject, WCSessionDelegate {
  static let shared = WatchLink()

  var onNewUserInfo: (() -> Void)?

  private static let pendingKey = "foxon.watch.pendingUserInfo"
  private let queue = DispatchQueue(label: "com.dmytrolutsik.foxon.watchlink")
  private var contextPendingActivation: [String: Any]?

  func activate() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  var state: [String: Any] {
    guard WCSession.isSupported() else { return ["supported": false] }
    let session = WCSession.default
    return [
      "supported": true,
      "activationState": session.activationState.rawValue,
      "isPaired": session.isPaired,
      "isWatchAppInstalled": session.isWatchAppInstalled,
      "isReachable": session.isReachable,
    ]
  }

  var hasPendingUserInfo: Bool {
    queue.sync {
      !(UserDefaults.standard.array(forKey: Self.pendingKey) ?? []).isEmpty
    }
  }

  func updateApplicationContext(_ context: [String: Any]) throws {
    guard WCSession.isSupported() else { return }
    guard WCSession.default.activationState == .activated else {
      queue.sync { contextPendingActivation = context }
      return
    }
    try WCSession.default.updateApplicationContext(context)
  }

  func consumePendingUserInfo() -> [[String: Any]] {
    queue.sync {
      let pending = UserDefaults.standard.array(forKey: Self.pendingKey) as? [[String: Any]] ?? []
      UserDefaults.standard.removeObject(forKey: Self.pendingKey)
      return pending
    }
  }

  // MARK: - WCSessionDelegate

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    guard activationState == .activated else { return }
    queue.sync {
      if let context = contextPendingActivation {
        contextPendingActivation = nil
        try? session.updateApplicationContext(context)
      }
    }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    // Required after the user switches to a different paired watch
    session.activate()
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    queue.sync {
      var pending = UserDefaults.standard.array(forKey: Self.pendingKey) as? [[String: Any]] ?? []
      pending.append(userInfo)
      UserDefaults.standard.set(pending, forKey: Self.pendingKey)
    }
    onNewUserInfo?()
  }
}
