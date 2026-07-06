import SwiftUI

@main
struct FoxonWatchApp: App {
    @StateObject private var phoneLink = PhoneLink.shared
    @StateObject private var controller = SessionController()
    @StateObject private var workoutManager = WorkoutManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(phoneLink)
                .environmentObject(controller)
                .environmentObject(workoutManager)
        }
    }
}
