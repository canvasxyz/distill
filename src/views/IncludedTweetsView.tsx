import { useMemo } from "react";
import { useStore } from "../store";
import { TweetsView } from "./TweetsView";
import { UploadView } from "./UploadView";

export function IncludedTweetsView() {
  const { tweets, excludedTweets } = useStore();

  const includedTweetsToDisplay = useMemo(() => {
    if (tweets === null) return [];

    return tweets.filter((tweet) => !excludedTweets[tweet.id]);
  }, [tweets, excludedTweets]);

  if (tweets === null) {
    return <UploadView />;
  }

  return <TweetsView tweetsToDisplay={includedTweetsToDisplay} />;
}
