import SwiftUI
import WatchKit

/// Horizontal pages mirroring Apple's Workout app: controls · logging · metrics.
struct SessionPagerView: View {
    @EnvironmentObject private var workoutManager: WorkoutManager
    @State private var page = 1

    var body: some View {
        TabView(selection: $page) {
            ControlsView().tag(0)
            LoggingView().tag(1)
            MetricsView().tag(2)
        }
        .onAppear {
            // Resuming a persisted session after a crash/relaunch: the
            // HealthKit session died with the process, start a fresh one.
            workoutManager.start()
        }
    }
}

// MARK: - Controls

struct ControlsView: View {
    @EnvironmentObject private var controller: SessionController
    @EnvironmentObject private var workoutManager: WorkoutManager
    @EnvironmentObject private var phoneLink: PhoneLink
    @State private var confirmDiscard = false

    var body: some View {
        VStack(spacing: 10) {
            Button {
                let health = workoutManager.snapshotMetrics()
                workoutManager.end()
                controller.finish(via: phoneLink, health: health)
                WKInterfaceDevice.current().play(.success)
            } label: {
                Label("Finish", systemImage: "flag.checkered")
            }
            .tint(.green)
            .disabled(!controller.canFinish)

            Button(role: .destructive) {
                confirmDiscard = true
            } label: {
                Label("Discard", systemImage: "xmark")
            }
        }
        .confirmationDialog("Discard this session?", isPresented: $confirmDiscard) {
            Button("Discard workout", role: .destructive) {
                workoutManager.cancel()
                controller.discard()
            }
            Button("Keep going", role: .cancel) {}
        }
    }
}

// MARK: - Logging

struct LoggingView: View {
    @EnvironmentObject private var controller: SessionController
    @State private var blockPage = 0
    @State private var editTarget: EditTarget?

    struct EditTarget: Identifiable {
        let exerciseIndex: Int
        let setIndex: Int
        var id: String { "\(exerciseIndex)-\(setIndex)" }
    }

    var body: some View {
        if let state = controller.session {
            let groups = state.groups
            let groupIndex = min(state.groupIndex, groups.count - 1)
            let group = groups[groupIndex]

            VStack(spacing: 4) {
                header(state: state, groupIndex: groupIndex, groupCount: groups.count)

                if group.count > 1 {
                    TabView(selection: $blockPage) {
                        ForEach(group, id: \.self) { exerciseIndex in
                            ExerciseCardView(
                                exerciseIndex: exerciseIndex,
                                inBlock: true,
                                onComplete: { handleCompletion(group: group, exerciseIndex: exerciseIndex) },
                                onEdit: { setIndex in
                                    editTarget = EditTarget(exerciseIndex: exerciseIndex, setIndex: setIndex)
                                }
                            )
                            .tag(exerciseIndex)
                        }
                    }
                    .tabViewStyle(.verticalPage)
                    .onAppear { blockPage = group[0] }
                } else {
                    ExerciseCardView(
                        exerciseIndex: group[0],
                        inBlock: false,
                        onComplete: {},
                        onEdit: { setIndex in
                            editTarget = EditTarget(exerciseIndex: group[0], setIndex: setIndex)
                        }
                    )
                }

                footer(groupIndex: groupIndex, groupCount: groups.count, group: group)
            }
            .sheet(item: $editTarget) { target in
                if let session = controller.session,
                   session.exercises.indices.contains(target.exerciseIndex),
                   session.exercises[target.exerciseIndex].sets.indices.contains(target.setIndex) {
                    let exercise = session.exercises[target.exerciseIndex]
                    SetEditorView(
                        exerciseName: exercise.name,
                        isBodyweight: exercise.isBodyweight,
                        set: exercise.sets[target.setIndex]
                    ) { load, reps in
                        controller.updateSet(
                            exerciseIndex: target.exerciseIndex,
                            setIndex: target.setIndex,
                            load: load,
                            reps: reps
                        )
                    }
                }
            }
        }
    }

    private func header(state: ActiveSessionState, groupIndex: Int, groupCount: Int) -> some View {
        HStack {
            Text(state.workoutTitle)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            Spacer()
            Text("\(state.completedSets)/\(state.totalSets)")
                .font(.caption2.monospacedDigit())
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 4)
    }

    private func footer(groupIndex: Int, groupCount: Int, group: [Int]) -> some View {
        HStack {
            Button {
                controller.goToGroup(groupIndex - 1)
            } label: {
                Image(systemName: "chevron.left")
            }
            .buttonStyle(.plain)
            .disabled(groupIndex == 0)

            Spacer()
            Text(group.count > 1 ? "Block · \(groupIndex + 1)/\(groupCount)" : "\(groupIndex + 1)/\(groupCount)")
                .font(.caption2)
                .foregroundStyle(.secondary)
            Spacer()

            Button {
                controller.goToGroup(groupIndex + 1)
            } label: {
                Image(systemName: "chevron.right")
            }
            .buttonStyle(.plain)
            .disabled(groupIndex >= groupCount - 1)
        }
        .padding(.horizontal, 8)
    }

    /// Superset rhythm: completing a set slides the vertical pager to the
    /// partner exercise that is furthest behind.
    private func handleCompletion(group: [Int], exerciseIndex: Int) {
        guard let partner = controller.suggestedBlockPartner(in: group, after: exerciseIndex) else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            withAnimation { blockPage = partner }
        }
    }
}

// MARK: - Exercise card

struct ExerciseCardView: View {
    @EnvironmentObject private var controller: SessionController
    let exerciseIndex: Int
    let inBlock: Bool
    let onComplete: () -> Void
    let onEdit: (Int) -> Void

    var body: some View {
        if let state = controller.session, state.exercises.indices.contains(exerciseIndex) {
            let exercise = state.exercises[exerciseIndex]
            ScrollView {
                VStack(alignment: .leading, spacing: 6) {
                    Text(exercise.name)
                        .font(.headline)
                        .lineLimit(2)

                    ForEach(Array(exercise.sets.enumerated()), id: \.element.id) { setIndex, set in
                        setRow(exercise: exercise, set: set, setIndex: setIndex)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private func setRow(exercise: SessionExercise, set: SessionSet, setIndex: Int) -> some View {
        HStack(spacing: 6) {
            Button {
                onEdit(setIndex)
            } label: {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: 4) {
                        if set.type == "WARMUP" {
                            Text("W")
                                .font(.caption2.bold())
                                .foregroundStyle(.orange)
                        }
                        Text(setLabel(set: set, bodyweight: exercise.isBodyweight))
                            .font(.body.monospacedDigit())
                    }
                    if let previous = exercise.previous, previous.indices.contains(setIndex) {
                        Text(ghostLabel(previous[setIndex], bodyweight: exercise.isBodyweight))
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                }
            }
            .buttonStyle(.plain)

            Spacer()

            Button {
                controller.toggleSet(exerciseIndex: exerciseIndex, setIndex: setIndex)
                if !set.completed {
                    WKInterfaceDevice.current().play(.success)
                    onComplete()
                }
            } label: {
                Image(systemName: set.completed ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(set.completed ? .green : .secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 2)
    }

    private func setLabel(set: SessionSet, bodyweight: Bool) -> String {
        bodyweight ? "\(set.reps) reps" : "\(formatLoad(set.load)) kg × \(set.reps)"
    }

    private func ghostLabel(_ previous: WatchPrevSet, bodyweight: Bool) -> String {
        bodyweight ? "was \(previous.reps)" : "was \(formatLoad(previous.load))×\(previous.reps)"
    }
}

func formatLoad(_ load: Double) -> String {
    load.truncatingRemainder(dividingBy: 1) == 0
        ? String(format: "%.0f", load)
        : String(format: "%.1f", load)
}

// MARK: - Metrics

struct MetricsView: View {
    @EnvironmentObject private var controller: SessionController
    @EnvironmentObject private var workoutManager: WorkoutManager

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let startTime = controller.session?.startTime {
                TimelineView(.periodic(from: .now, by: 1)) { context in
                    Text(formatElapsed(context.date.timeIntervalSince(startTime)))
                        .font(.system(.title2, design: .rounded).monospacedDigit())
                        .foregroundStyle(.yellow)
                }
            }

            HStack(spacing: 4) {
                Image(systemName: "heart.fill")
                    .foregroundStyle(.red)
                Text(workoutManager.heartRate > 0 ? "\(Int(workoutManager.heartRate))" : "––")
                    .font(.title3.monospacedDigit())
                Text("bpm")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 4) {
                Image(systemName: "flame.fill")
                    .foregroundStyle(.orange)
                Text("\(Int(workoutManager.activeEnergy))")
                    .font(.title3.monospacedDigit())
                Text("kcal")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func formatElapsed(_ interval: TimeInterval) -> String {
        let seconds = max(0, Int(interval))
        if seconds >= 3600 {
            return String(format: "%d:%02d:%02d", seconds / 3600, (seconds % 3600) / 60, seconds % 60)
        }
        return String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }
}

// MARK: - Summary

struct SummaryView: View {
    @EnvironmentObject private var controller: SessionController
    @EnvironmentObject private var phoneLink: PhoneLink
    let summary: FinishedSummary

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                Text("Devoted.")
                    .font(.title3.bold())
                Text(summary.workoutTitle)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Text("\(summary.completedSets)/\(summary.totalSets) sets · \(Int(summary.duration / 60)) min")
                    .font(.body.monospacedDigit())

                Text(
                    phoneLink.isReachable
                        ? "Sent to your iPhone — seal it there to reveal your score."
                        : "Will sync when your iPhone is near."
                )
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

                Button("Done") {
                    controller.clearPostSession()
                }
            }
        }
    }
}
