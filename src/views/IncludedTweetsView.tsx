import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { usePagination } from "../hooks/usePagination";
import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";

function IncludedTweetsViewInner() {
  const { excludedTweetIds } = useStore();
  const tweets = useLiveQuery(() => db.tweets.toArray());

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
