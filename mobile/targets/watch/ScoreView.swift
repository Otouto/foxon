import SwiftUI

/// Devotion reveal on the wrist. Waits for the phone to relay the score
/// (`session.result`); falls back to an honest "check your iPhone" state when
/// the phone stays unreachable.
struct ScoreView: View {
    @EnvironmentObject private var controller: SessionController
    @EnvironmentObject private var phoneLink: PhoneLink
    let context: PostSessionState

    @State private var ringProgress: Double = 0
    @State private var waitedTooLong = false

    private var result: SessionResult? {
        guard let result = phoneLink.lastResult,
              result.workoutId == context.workoutId,
              result.startTime == context.startTimeISO
        else { return nil }
        return result
    }

    var body: some View {
        Group {
            if let result, let score = result.score {
                revealed(score: score, grade: result.grade)
            } else {
                waiting
            }
        }
        .task {
            try? await Task.sleep(for: .seconds(30))
            waitedTooLong = true
        }
    }

    private func revealed(score: Int, grade: String?) -> some View {
        VStack(spacing: 6) {
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.25), lineWidth: 9)
                Circle()
                    .trim(from: 0, to: ringProgress)
                    .stroke(
                        scoreColor(score),
                        style: StrokeStyle(lineWidth: 9, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 0) {
                    Text("\(score)")
                        .font(.system(size: 34, weight: .bold, design: .rounded).monospacedDigit())
                    Text("DEVOTION")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 96, height: 96)
            .onAppear {
                withAnimation(.easeOut(duration: 1.2)) {
                    ringProgress = min(1, Double(score) / 100)
                }
            }

            if let grade {
                Text(grade)
                    .font(.footnote.weight(.semibold))
            }

            Button("Done") {
                controller.clearPostSession()
            }
        }
    }

    private var waiting: some View {
        VStack(spacing: 10) {
            if waitedTooLong {
                Image(systemName: "iphone.gen3")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                Text("Your score is waiting on your iPhone.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                Button("Done") {
                    controller.clearPostSession()
                }
            } else {
                ProgressView()
                Text("Revealing your devotion…")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func scoreColor(_ score: Int) -> Color {
        switch score {
        case 90...: return .green
        case 80..<90: return .mint
        case 70..<80: return .yellow
        default: return .orange
        }
    }
}
