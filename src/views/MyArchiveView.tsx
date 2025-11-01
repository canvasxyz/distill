import { useStore } from "../state/store";
import { UploadPanel } from "./UploadView";
import { ModelQuerySection } from "./query_view/ModelQueryView";
import { LoadingView } from "./LoadingView";
import { FeedbackButtons } from "../components/FeedbackButtons";

export function MyArchiveView() {
  const { appIsReady, dbHasTweets } = useStore();

  return (
    <div>
      {appIsReady ? (
        <div className="mx-auto flex max-h-screen w-full max-w-6xl flex-col px-5 py-4">
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
