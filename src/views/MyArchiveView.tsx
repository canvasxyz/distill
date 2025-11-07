import { useStore } from "../state/store";
import { ModelQuerySection } from "./query_view/ModelQueryView";
import { LoadingView } from "./LoadingView";
import { FeedbackButtons } from "../components/FeedbackButtons";

export function MyArchiveView() {
  const { appIsReady } = useStore();

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
          <>
            <br />
            <ModelQuerySection />
            <FeedbackButtons />
          </>
        </div>
      ) : (
        <LoadingView />
      )}
    </div>
  );
}
