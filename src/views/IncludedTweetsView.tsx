import { TweetsView } from "./TweetsView";
import { usePagination } from "../hooks/usePagination";
import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";

function IncludedTweetsViewInner() {
  const tweets = useLiveQuery(() => db.tweets.toArray());

  const excludedTweetIds = useLiveQuery(() => db.excludedTweetIds.toArray());
  const excludedTweetIdsSet = useMemo(
    () => new Set((excludedTweetIds || []).map((entry) => entry.id)),
    [excludedTweetIds]
  );

  const includedTweets = useMemo(
    () => (tweets || []).filter((tweet) => !excludedTweetIdsSet.has(tweet.id)),
    [tweets, excludedTweetIdsSet]
  );

  const {
    itemsToDisplay: paginatedIncludedTweets,
    navigateNext,
    navigatePrevious,
  } = usePagination({
    items: includedTweets,
    limit: 20,
  });

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
export function IncludedTweetsView() {
  return (
    <ShowIfTweetsLoaded>
      <IncludedTweetsViewInner />
    </ShowIfTweetsLoaded>
  );
}
