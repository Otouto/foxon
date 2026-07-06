import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var controller: SessionController

    var body: some View {
        if let summary = controller.summary {
            SummaryView(summary: summary)
        } else if controller.session != nil {
            SessionPagerView()
        } else {
            WorkoutListView()
        }
    }
}
