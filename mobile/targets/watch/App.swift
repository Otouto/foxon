import SwiftUI

@main
struct FoxonWatchApp: App {
    @StateObject private var phoneLink = PhoneLink.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(phoneLink)
        }
    }
}
