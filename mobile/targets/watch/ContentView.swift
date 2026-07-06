import SwiftUI

/// Phase 0 spike screen: proves the WatchConnectivity round-trip.
/// Shows the applicationContext pushed by the iPhone and sends a test
/// payload back through the queued transfer channel.
struct ContentView: View {
    @EnvironmentObject private var phoneLink: PhoneLink

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 6) {
                    Circle()
                        .fill(phoneLink.isReachable ? .green : .gray)
                        .frame(width: 8, height: 8)
                    Text(phoneLink.isReachable ? "iPhone reachable" : "iPhone away")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("From phone")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(phoneLink.contextJSON ?? "Nothing yet")
                        .font(.footnote)
                        .lineLimit(6)
                }

                Button {
                    phoneLink.ping()
                } label: {
                    Label("Ping iPhone", systemImage: "arrow.up.forward.circle")
                }

                if let status = phoneLink.lastSendStatus {
                    Text(status)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .navigationTitle("Foxon")
    }
}

#Preview {
    ContentView()
        .environmentObject(PhoneLink.shared)
}
