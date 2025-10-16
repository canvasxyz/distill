import { db } from "./db";
import type { FilterMatch } from "./types";

export const accountObservable = () => db.accounts.toArray();

export const allTweetsObservable = () => db.tweets.toArray();
export const includedTweetsObservable = async () => {
  const allTweets = await db.tweets.toArray();
  const excludedTweetIds = await db.excludedTweetIds.toArray();

  const excludedTweetIdsSet = new Set(
    (excludedTweetIds || []).map((entry) => entry.id)
  );

  const includedTweets = (allTweets || []).filter(
    (tweet) => !excludedTweetIdsSet.has(tweet.id)
  );
  return includedTweets;
};

export const excludedTweetsObservable = async () => {
  const allTweets = await db.tweets.toArray();
  const excludedTweetIds = await db.excludedTweetIds.toArray();

  const excludedTweetIdsSet = new Set(
    (excludedTweetIds || []).map((entry) => entry.id)
  );

  const includedTweets = (allTweets || []).filter((tweet) =>
    excludedTweetIdsSet.has(tweet.id)
  );
  return includedTweets;
};

export const filterTweetsObservable = async () => {
  const allTweets = await db.tweets.toArray();
  const tweetsById: Record<string, (typeof allTweets)[number]> = {};
  for (const tweet of allTweets) {
    tweetsById[tweet.id] = tweet;
  }

  const filterTweetIds = await db.filterTweetIds.toArray();
  const tweetsByFilterName: Record<string, typeof allTweets> = {};
  const filterMatchesByTweetId: Record<string, FilterMatch[]> = {};

  for (const filterMatch of filterTweetIds) {
    const { filterName, id } = filterMatch;
    tweetsByFilterName[filterName] ||= [];
    tweetsByFilterName[filterName].push(tweetsById[id]);

    filterMatchesByTweetId[id] ||= [];
    filterMatchesByTweetId[id].push(filterMatch);
  }
  return { tweetsByFilterName, filterMatchesByTweetId };
};

export const queryResultsObservable = async () =>
  await db.queryResults.toArray();
