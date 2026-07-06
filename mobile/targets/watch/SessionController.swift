import Foundation

/// Owns the active session: set completion, crown edits, block navigation,
/// and the completion payload. Every mutation is persisted to UserDefaults so
/// a crash or reboot mid-workout never loses logged sets.
final class SessionController: ObservableObject {
    @Published private(set) var session: ActiveSessionState? {
        didSet { persist() }
    }
    @Published var summary: FinishedSummary?

    private static let persistKey = "foxon.watch.activeSession"

    init() {
        if let data = UserDefaults.standard.data(forKey: Self.persistKey),
           let restored = try? JSONDecoder().decode(ActiveSessionState.self, from: data) {
            session = restored
        }
    }

    func start(_ workout: WatchWorkout) {
        let exercises = workout.exercises
            .sorted { $0.order < $1.order }
            .map { exercise in
                SessionExercise(
                    itemId: exercise.itemId,
                    exerciseId: exercise.exerciseId,
                    name: exercise.name,
                    order: exercise.order,
                    blockId: exercise.blockId,
                    blockOrder: exercise.blockOrder,
                    equipment: exercise.equipment,
                    sets: exercise.sets
                        .sorted { $0.order < $1.order }
                        .map { set in
                            SessionSet(
                                id: UUID(),
                                type: set.type,
                                targetLoad: set.targetLoad,
                                targetReps: set.targetReps,
                                load: set.targetLoad,
                                reps: set.targetReps,
                                completed: false,
                                order: set.order
                            )
                        },
                    previous: exercise.previous
                )
            }
        summary = nil
        session = ActiveSessionState(
            workoutId: workout.id,
            workoutTitle: workout.title,
            startTime: Date(),
            exercises: exercises,
            groupIndex: 0
        )
    }

    // MARK: - Logging mutations

    func toggleSet(exerciseIndex: Int, setIndex: Int) {
        guard var state = session,
              state.exercises.indices.contains(exerciseIndex),
              state.exercises[exerciseIndex].sets.indices.contains(setIndex)
        else { return }
        state.exercises[exerciseIndex].sets[setIndex].completed.toggle()
        session = state
    }

    func updateSet(exerciseIndex: Int, setIndex: Int, load: Double, reps: Int) {
        guard var state = session,
              state.exercises.indices.contains(exerciseIndex),
              state.exercises[exerciseIndex].sets.indices.contains(setIndex)
        else { return }
        state.exercises[exerciseIndex].sets[setIndex].load = load
        state.exercises[exerciseIndex].sets[setIndex].reps = max(1, reps)
        session = state
    }

    // MARK: - Navigation

    func goToGroup(_ index: Int) {
        guard var state = session, (0..<state.groups.count).contains(index) else { return }
        state.groupIndex = index
        session = state
    }

    /// After completing a set inside a superset, suggest the partner exercise
    /// with the fewest completed sets — the set-by-set alternation rhythm.
    func suggestedBlockPartner(in group: [Int], after exerciseIndex: Int) -> Int? {
        guard let state = session, group.count > 1 else { return nil }
        let others = group.filter { $0 != exerciseIndex }
        let behind = others.filter {
            state.exercises[$0].completedCount < state.exercises[exerciseIndex].completedCount &&
            state.exercises[$0].completedCount < state.exercises[$0].sets.count
        }
        return behind.min { state.exercises[$0].completedCount < state.exercises[$1].completedCount }
    }

    var canFinish: Bool {
        (session?.completedSets ?? 0) > 0
    }

    // MARK: - Lifecycle

    /// Ends the session and hands the payload to the phone relay. The transfer
    /// is queued by WatchConnectivity, so this works with the phone far away.
    func finish(via phoneLink: PhoneLink) {
        guard let state = session else { return }
        let endTime = Date()
        let payload = CompletedSessionPayload(
            workoutId: state.workoutId,
            workoutTitle: state.workoutTitle,
            startTime: ISO8601.string(from: state.startTime),
            endTime: ISO8601.string(from: endTime),
            duration: Int(endTime.timeIntervalSince(state.startTime)),
            exercises: state.exercises.map { exercise in
                CompletedSessionPayload.Exercise(
                    exerciseId: exercise.exerciseId,
                    exerciseName: exercise.name,
                    order: exercise.order,
                    sets: exercise.sets.map { set in
                        CompletedSessionPayload.Exercise.Set(
                            type: set.type,
                            load: set.load,
                            reps: set.reps,
                            completed: set.completed,
                            order: set.order
                        )
                    }
                )
            }
        )
        if let data = try? JSONEncoder().encode(payload),
           let json = String(data: data, encoding: .utf8) {
            phoneLink.sendCompletedSession(json: json)
        }
        summary = FinishedSummary(
            workoutTitle: state.workoutTitle,
            completedSets: state.completedSets,
            totalSets: state.totalSets,
            duration: endTime.timeIntervalSince(state.startTime)
        )
        session = nil
    }

    func discard() {
        session = nil
        summary = nil
    }

    func dismissSummary() {
        summary = nil
    }

    private func persist() {
        if let state = session, let data = try? JSONEncoder().encode(state) {
            UserDefaults.standard.set(data, forKey: Self.persistKey)
        } else {
            UserDefaults.standard.removeObject(forKey: Self.persistKey)
        }
    }
}
