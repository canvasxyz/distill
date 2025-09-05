import { useMemo } from "react";
import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { UploadView } from "./UploadView";
import { usePagination } from "../hooks/usePagination";

export function IncludedTweetsView() {
  const { tweets, excludedTweetIds } = useStore();

  const includedTweetsToDisplay = useMemo(() => {
    if (tweets === null) return [];

    return tweets.filter((tweet) => !excludedTweetIds[tweet.id]);
  }, [tweets, excludedTweetIds]);

  const {
    itemsToDisplay: paginatedIncludedTweetsToDisplay,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: includedTweetsToDisplay,
    limit: 20,
  });

  if (paginatedIncludedTweetsToDisplay === null) {
    return <UploadView />;
  }

  return (
    <TweetsView
      title="Included Tweets"
      tweetsToDisplay={paginatedIncludedTweetsToDisplay}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}
