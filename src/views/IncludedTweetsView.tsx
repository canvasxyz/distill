import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { UploadView } from "./UploadView";
import { usePagination } from "../hooks/usePagination";

export function IncludedTweetsView() {
  const { includedTweets } = useStore();

  const {
    itemsToDisplay: paginatedIncludedTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: includedTweets,
    limit: 20,
  });

  if (paginatedIncludedTweets === null) {
    return <UploadView />;
  }

  return (
    <TweetsView
      title="Included Tweets"
      tweetsToDisplay={paginatedIncludedTweets}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}
