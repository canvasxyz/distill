import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { usePagination } from "../hooks/usePagination";
import { useMemo } from "react";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";

function ExcludedTweetsViewInner() {
  const { excludedTweetIds } = useStore();
  const tweets = useLiveQuery(() => db.tweets.toArray());

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

export function ExcludedTweetsView() {
  return (
    <ShowIfTweetsLoaded>
      <ExcludedTweetsViewInner />
    </ShowIfTweetsLoaded>
  );
}
