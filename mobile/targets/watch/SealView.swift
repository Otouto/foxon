import SwiftUI
import WatchKit

/// Post-finish capture: crown-driven effort dial (RPE 1–10) and an optional
/// dictated vibe line. The seal only reaches the server when a vibe exists;
/// effort-only runs still get the score reveal, and the phone's
/// unsealed-session card stays as the fallback for the reflection.
struct SealView: View {
    @EnvironmentObject private var controller: SessionController
    @EnvironmentObject private var phoneLink: PhoneLink

    @State private var rpe: Double = 7
    @State private var vibeLine = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                Text("How hard was it?")
                    .font(.headline)

                VStack(spacing: 2) {
                    Text("\(Int(rpe))")
                        .font(.system(size: 40, weight: .bold, design: .rounded).monospacedDigit())
                        .foregroundStyle(.green)
                    Text(effortLabel(Int(rpe)))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    HStack(spacing: 3) {
                        ForEach(1...10, id: \.self) { step in
                            RoundedRectangle(cornerRadius: 1.5)
                                .fill(step <= Int(rpe) ? Color.green : Color.gray.opacity(0.3))
                                .frame(height: 6 + CGFloat(step))
                        }
                    }
                    .frame(height: 18, alignment: .bottom)
                }
                .frame(maxWidth: .infinity)
                .focusable()
                .digitalCrownRotation(
                    $rpe,
                    from: 1,
                    through: 10,
                    by: 1,
                    sensitivity: .low,
                    isContinuous: false,
                    isHapticFeedbackEnabled: true
                )

                TextField("Add a vibe line", text: $vibeLine)
                    .font(.footnote)

                Button {
                    controller.submitSeal(rpe: Int(rpe), vibeLine: vibeLine, via: phoneLink)
                    WKInterfaceDevice.current().play(.success)
                } label: {
                    Label("Reveal my score", systemImage: "sparkles")
                }
                .tint(.green)

                Button("Seal on iPhone later") {
                    controller.skipSeal()
                }
                .font(.footnote)
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
            }
        }
    }

    private func effortLabel(_ rpe: Int) -> String {
        switch rpe {
        case ...3: return "Easy"
        case ...6: return "Moderate"
        case ...8: return "Hard"
        default: return "All out"
        }
    }
}
