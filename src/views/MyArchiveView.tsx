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
        <div className="max-h-screen flex flex-col p-[15px_20px] mx-auto max-w-[1200px]">
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
