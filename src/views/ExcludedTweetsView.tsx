import { useMemo } from "react";
import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { UploadView } from "./UploadView";

export function ExcludedTweetsView() {
  const { tweets, excludedTweets } = useStore();

  const excludedTweetsToDisplay = useMemo(() => {
    if (tweets === null) return [];

    return tweets.filter((tweet) => excludedTweets[tweet.id]);
  }, [tweets, excludedTweets]);

  if (tweets === null) {
    return <UploadView />;
  }

  return (
    <TweetsView
      title="Excluded Tweets"
      tweetsToDisplay={excludedTweetsToDisplay}
    />
  );
}
