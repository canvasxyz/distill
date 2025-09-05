import { useMemo } from "react";
import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { UploadView } from "./UploadView";
import { usePagination } from "../hooks/usePagination";

export function ExcludedTweetsView() {
  const { tweets, excludedTweets } = useStore();

  const excludedTweetsToDisplay = useMemo(() => {
    if (tweets === null) return [];

    return tweets.filter((tweet) => excludedTweets[tweet.id]);
  }, [tweets, excludedTweets]);

  const {
    itemsToDisplay: paginatedExcludedTweetsToDisplay,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: excludedTweetsToDisplay,
    limit: 20,
  });

  if (paginatedExcludedTweetsToDisplay === null) {
    return <UploadView />;
  }

  return (
    <TweetsView
      title="Excluded Tweets"
      tweetsToDisplay={paginatedExcludedTweetsToDisplay}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}
