import SwiftUI

struct WorkoutListView: View {
    @EnvironmentObject private var phoneLink: PhoneLink
    @EnvironmentObject private var controller: SessionController
    @EnvironmentObject private var workoutManager: WorkoutManager

    var body: some View {
        NavigationStack {
            Group {
                if phoneLink.workouts.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "iphone.and.arrow.forward")
                            .font(.title3)
                            .foregroundStyle(.secondary)
                        Text("No workouts yet")
                            .font(.headline)
                        Text("Open Foxon on your iPhone to sync your plan.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                } else {
                    List(phoneLink.workouts) { workout in
                        Button {
                            controller.start(workout)
                            workoutManager.start()
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(workout.title)
                                    .font(.headline)
                                Text(subtitle(for: workout))
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Foxon")
        }
    }

    private func subtitle(for workout: WatchWorkout) -> String {
        var parts = ["\(workout.exercises.count) exercises"]
        if let iso = workout.lastSessionDate, let date = ISO8601.date(from: iso) {
            let formatter = RelativeDateTimeFormatter()
            formatter.unitsStyle = .short
            parts.append(formatter.localizedString(for: date, relativeTo: Date()))
        }
        return parts.joined(separator: " · ")
    }
}
