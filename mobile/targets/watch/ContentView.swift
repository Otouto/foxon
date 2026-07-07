import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var controller: SessionController

    var body: some View {
        if let post = controller.postSession {
            switch post.phase {
            case .seal:
                SealView()
            case .awaitingScore:
                ScoreView(context: post)
            case .summary:
                SummaryView(summary: post.summary)
            }
        } else if controller.session != nil {
            SessionPagerView()
        } else {
            WorkoutListView()
        }
    }
}
