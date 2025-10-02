import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { usePagination } from "../hooks/usePagination";
import { Navigate } from "react-router";
import { useMemo } from "react";

export function IncludedTweetsView() {
  const { excludedTweetIds, tweets } = useStore();

  const includedTweets = useMemo(
    () => (tweets || []).filter((tweet) => excludedTweetIds[tweet.id] != true),
    [tweets, excludedTweetIds]
  );

  const {
    itemsToDisplay: paginatedIncludedTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: includedTweets,
    limit: 20,
  });

  if (tweets === null) {
    return <Navigate to="/upload-tweets" />;
  }

  return (
    <TweetsView
      allTweets={includedTweets!}
      title="Included Tweets"
      tweetsToDisplay={paginatedIncludedTweets!}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}
