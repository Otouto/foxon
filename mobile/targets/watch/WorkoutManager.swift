import Foundation
import HealthKit

/// Runs the HealthKit workout session while Foxon logs sets: live heart rate,
/// active calories, ring credit, and background runtime. HealthKit failures
/// (denied permission, simulator quirks) never block logging — the session
/// simply runs without live metrics.
final class WorkoutManager: NSObject, ObservableObject {
    @Published var heartRate: Double = 0
    @Published var activeEnergy: Double = 0
    @Published var isRunning = false

    private let healthStore = HKHealthStore()
    private var hkSession: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?

    func start() {
        guard hkSession == nil, HKHealthStore.isHealthDataAvailable() else { return }

        let share: Set<HKSampleType> = [HKObjectType.workoutType()]
        let read: Set<HKObjectType> = [
            HKQuantityType(.heartRate),
            HKQuantityType(.activeEnergyBurned),
        ]

        healthStore.requestAuthorization(toShare: share, read: read) { [weak self] granted, _ in
            guard granted else { return }
            DispatchQueue.main.async { self?.beginSession() }
        }
    }

    private func beginSession() {
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .traditionalStrengthTraining
        configuration.locationType = .indoor

        do {
            let session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            let builder = session.associatedWorkoutBuilder()
            builder.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: configuration)
            session.delegate = self
            builder.delegate = self
            self.hkSession = session
            self.builder = builder

            let start = Date()
            session.startActivity(with: start)
            builder.beginCollection(withStart: start) { _, _ in }
        } catch {
            hkSession = nil
            builder = nil
        }
    }

    /// Session-wide stats from the live builder — read BEFORE end(), which
    /// tears the builder down asynchronously.
    func snapshotMetrics() -> HealthMetrics? {
        guard let builder else { return nil }
        let bpm = HKUnit.count().unitDivided(by: .minute())
        let hrStats = builder.statistics(for: HKQuantityType(.heartRate))
        let energy = builder.statistics(for: HKQuantityType(.activeEnergyBurned))
        let metrics = HealthMetrics(
            avgHeartRate: hrStats?.averageQuantity()?.doubleValue(for: bpm),
            maxHeartRate: hrStats?.maximumQuantity()?.doubleValue(for: bpm),
            activeCalories: energy?.sumQuantity()?.doubleValue(for: .kilocalorie())
        )
        return metrics.isEmpty ? nil : metrics
    }

    /// Ends the HealthKit session and saves the HKWorkout so it lands in the
    /// Fitness app and counts toward the rings.
    func end() {
        guard let session = hkSession, let builder = builder else {
            reset()
            return
        }
        session.end()
        builder.endCollection(withEnd: Date()) { [weak self] _, _ in
            builder.finishWorkout { _, _ in
                DispatchQueue.main.async { self?.reset() }
            }
        }
    }

    /// Discard without saving a workout to Health.
    func cancel() {
        guard let session = hkSession, let builder = builder else {
            reset()
            return
        }
        session.end()
        builder.discardWorkout()
        reset()
    }

    private func reset() {
        hkSession = nil
        builder = nil
        isRunning = false
        heartRate = 0
        activeEnergy = 0
    }
}

extension WorkoutManager: HKWorkoutSessionDelegate {
    func workoutSession(
        _ workoutSession: HKWorkoutSession,
        didChangeTo toState: HKWorkoutSessionState,
        from fromState: HKWorkoutSessionState,
        date: Date
    ) {
        DispatchQueue.main.async {
            self.isRunning = toState == .running
        }
    }

    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        DispatchQueue.main.async { self.reset() }
    }
}

extension WorkoutManager: HKLiveWorkoutBuilderDelegate {
    func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        for type in collectedTypes {
            guard let quantityType = type as? HKQuantityType,
                  let statistics = workoutBuilder.statistics(for: quantityType)
            else { continue }

            DispatchQueue.main.async {
                switch quantityType {
                case HKQuantityType(.heartRate):
                    let unit = HKUnit.count().unitDivided(by: .minute())
                    self.heartRate = statistics.mostRecentQuantity()?.doubleValue(for: unit) ?? 0
                case HKQuantityType(.activeEnergyBurned):
                    self.activeEnergy = statistics.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
                default:
                    break
                }
            }
        }
    }

    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}
}
