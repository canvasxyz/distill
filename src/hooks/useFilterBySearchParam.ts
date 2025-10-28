import type { Tweet } from "../types";
import { useMemo } from "react";

export const useFilterBySearchParam = (
  searchTerm: string | null,
  tweets: Tweet[],
) => {
  const filteredTweets = useMemo(() => {
    if (!searchTerm) return tweets;

    return tweets.filter((tweet) => {
      const fullText = tweet.full_text.toLowerCase();
      return fullText.indexOf(searchTerm.toLowerCase()) !== -1;
    });
  }, [searchTerm, tweets]);

  return filteredTweets;
};
