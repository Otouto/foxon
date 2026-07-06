import SwiftUI
import WatchKit

/// Crown-first set editing: tap a value to focus it, turn the crown to scrub
/// (0.5 kg detents for weight, whole reps). No wheel pickers — the crown is
/// the picker.
struct SetEditorView: View {
    let exerciseName: String
    let isBodyweight: Bool
    let set: SessionSet
    let onSave: (Double, Int) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var load: Double
    @State private var reps: Double
    @FocusState private var focusedField: Field?

    private enum Field {
        case load, reps
    }

    init(exerciseName: String, isBodyweight: Bool, set: SessionSet, onSave: @escaping (Double, Int) -> Void) {
        self.exerciseName = exerciseName
        self.isBodyweight = isBodyweight
        self.set = set
        self.onSave = onSave
        _load = State(initialValue: set.load)
        _reps = State(initialValue: Double(set.reps))
    }

    var body: some View {
        VStack(spacing: 8) {
            Text(exerciseName)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)

            if !isBodyweight {
                valueRow(
                    label: "kg",
                    text: formatLoad(load),
                    target: "target \(formatLoad(set.targetLoad))",
                    isFocused: focusedField == .load
                )
                .focusable()
                .focused($focusedField, equals: .load)
                .digitalCrownRotation(
                    $load,
                    from: 0,
                    through: 300,
                    by: 0.5,
                    sensitivity: .medium,
                    isContinuous: false,
                    isHapticFeedbackEnabled: true
                )
                .onTapGesture { focusedField = .load }
            }

            valueRow(
                label: "reps",
                text: "\(Int(reps))",
                target: "target \(set.targetReps)",
                isFocused: focusedField == .reps
            )
            .focusable()
            .focused($focusedField, equals: .reps)
            .digitalCrownRotation(
                $reps,
                from: 1,
                through: 100,
                by: 1,
                sensitivity: .medium,
                isContinuous: false,
                isHapticFeedbackEnabled: true
            )
            .onTapGesture { focusedField = .reps }

            Button("Save") {
                onSave(load, Int(reps))
                WKInterfaceDevice.current().play(.click)
                dismiss()
            }
        }
        .onAppear {
            focusedField = isBodyweight ? .reps : .load
        }
    }

    private func valueRow(label: String, text: String, target: String, isFocused: Bool) -> some View {
        VStack(spacing: 0) {
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(text)
                    .font(.system(.title2, design: .rounded).monospacedDigit())
                    .foregroundStyle(isFocused ? .green : .primary)
                Text(label)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            Text(target)
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 4)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(isFocused ? Color.green.opacity(0.15) : Color.clear)
        )
    }
}
