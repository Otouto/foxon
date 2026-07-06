import Foundation

// MARK: - Sync payload from the phone (see mobile/src/lib/watchSync.ts)

struct WatchSyncEnvelope: Codable {
    let v: Int
    let sentAt: String
    let workouts: [WatchWorkout]
}

struct WatchWorkout: Codable, Identifiable {
    let id: String
    let title: String
    let lastSessionDate: String?
    let exercises: [WatchExercise]
}

struct WatchExercise: Codable, Identifiable {
    let itemId: String
    let exerciseId: String
    let name: String
    let order: Int
    let blockId: String?
    let blockOrder: Int?
    let equipment: String?
    let sets: [WatchTargetSet]
    let previous: [WatchPrevSet]?

    var id: String { itemId }
    var isBodyweight: Bool { equipment == nil }
}

struct WatchTargetSet: Codable {
    let type: String
    let targetLoad: Double
    let targetReps: Int
    let order: Int
}

struct WatchPrevSet: Codable {
    let load: Double
    let reps: Int
}

// MARK: - Active session state (persisted for crash recovery)

struct SessionSet: Codable, Identifiable {
    let id: UUID
    let type: String
    let targetLoad: Double
    let targetReps: Int
    var load: Double
    var reps: Int
    var completed: Bool
    let order: Int
}

struct SessionExercise: Codable, Identifiable {
    let itemId: String
    let exerciseId: String
    let name: String
    let order: Int
    let blockId: String?
    let blockOrder: Int?
    let equipment: String?
    var sets: [SessionSet]
    let previous: [WatchPrevSet]?

    var id: String { itemId }
    var isBodyweight: Bool { equipment == nil }
    var completedCount: Int { sets.filter(\.completed).count }
}

struct ActiveSessionState: Codable {
    let workoutId: String
    let workoutTitle: String
    let startTime: Date
    var exercises: [SessionExercise]
    var groupIndex: Int

    /// Exercise indices grouped for display: consecutive-by-order exercises
    /// sharing a blockId form one superset group shown on a single screen.
    var groups: [[Int]] {
        var result: [[Int]] = []
        var byBlock: [String: Int] = [:]
        for (index, exercise) in exercises.enumerated() {
            if let blockId = exercise.blockId {
                if let existing = byBlock[blockId] {
                    result[existing].append(index)
                    continue
                }
                byBlock[blockId] = result.count
            }
            result.append([index])
        }
        return result
    }

    var completedSets: Int { exercises.reduce(0) { $0 + $1.completedCount } }
    var totalSets: Int { exercises.reduce(0) { $0 + $1.sets.count } }
}

struct FinishedSummary {
    let workoutTitle: String
    let completedSets: Int
    let totalSets: Int
    let duration: TimeInterval
}

// MARK: - Completion payload sent to the phone (mirrors CompletedSessionPayload)

struct CompletedSessionPayload: Encodable {
    struct Exercise: Encodable {
        struct Set: Encodable {
            let type: String
            let load: Double
            let reps: Int
            let completed: Bool
            let order: Int
        }

        let exerciseId: String
        let exerciseName: String
        let order: Int
        let sets: [Set]
    }

    let workoutId: String
    let workoutTitle: String
    let startTime: String
    let endTime: String
    let duration: Int
    let exercises: [Exercise]
}

enum ISO8601 {
    private static let formatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    static func string(from date: Date) -> String {
        formatter.string(from: date)
    }

    static func date(from string: String) -> Date? {
        formatter.date(from: string) ?? ISO8601DateFormatter().date(from: string)
    }
}
