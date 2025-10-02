import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { usePagination } from "../hooks/usePagination";
import { Navigate } from "react-router";
import { useMemo } from "react";

export function ExcludedTweetsView() {
  const { excludedTweetIds, tweets } = useStore();

  const excludedTweets = useMemo(
    () => (tweets || []).filter((tweet) => excludedTweetIds[tweet.id] == true),
    [tweets, excludedTweetIds]
  );

  const {
    itemsToDisplay: paginatedExcludedTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: excludedTweets,
    limit: 20,
  });

  if (tweets === null) {
    return <Navigate to="/upload-tweets" />;
  }

  return (
    <TweetsView
      allTweets={excludedTweets}
      title="Excluded Tweets"
      tweetsToDisplay={paginatedExcludedTweets!}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}
