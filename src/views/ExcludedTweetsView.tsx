import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { UploadView } from "./UploadView";
import { usePagination } from "../hooks/usePagination";

export function ExcludedTweetsView() {
  const { excludedTweets } = useStore();

  const {
    itemsToDisplay: paginatedExcludedTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: excludedTweets,
    limit: 20,
  });

  if (paginatedExcludedTweets === null) {
    return <UploadView />;
  }

  return (
    <TweetsView
      title="Excluded Tweets"
      tweetsToDisplay={paginatedExcludedTweets}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}
