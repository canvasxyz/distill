import { useStore } from "../state/store";
import { UploadPanel } from "./UploadView";
import { ModelQuerySection } from "./query_view/ModelQueryView";
import { PastQueries } from "./query_view/SidebarQueries";
import { LoadingView } from "./LoadingView";
import { FeedbackButtons } from "../components/FeedbackButtons";

export function MyArchiveView() {
  const { appIsReady, dbHasTweets } = useStore();

  return (
    <div>
      {appIsReady ? (
        <div
          style={{
            maxHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            padding: "15px 20px",
            margin: "0 auto",
            maxWidth: "1200px",
          }}
        >
          {dbHasTweets ? (
            <>
              <br />
              <ModelQuerySection />
              <FeedbackButtons />
            </>
          ) : (
            <UploadPanel />
          )}
        </div>
      ) : (
        <LoadingView />
      )}
    </div>
  );
}
