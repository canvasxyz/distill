import type { Account, Tweet } from "./types";
import { unzip, type ZipEntry } from "unzipit";
import { parseTwitterArchiveFile } from "./twitterArchiveParser";

export const processTwitterArchive = async (
  file: File
): Promise<{ account: Account; tweets: Tweet[] }> => {
  // This is a stub method. Implement the logic to parse the Twitter archive zip file.
  // Once parsed, use setTweets to update the tweets state.
  console.log("Parsing Twitter archive:", file.name);
  const zipInfo = await unzip(file);
  let tweetEntry: ZipEntry | null = null;
  for (const entry of Object.values(zipInfo.entries)) {
    if (entry.name.endsWith("/tweet.js") || entry.name.endsWith("/tweets.js")) {
      console.log("found tweet file in archive!");
      tweetEntry = entry;
      break;
    }
  }
  if (!tweetEntry) {
    throw new Error("tweet.js or tweets.js file not found in archive!");
  }

  const tweetsContent = new TextDecoder().decode(
    new Uint8Array(await tweetEntry.arrayBuffer())
  );

  const tweets = parseTwitterArchiveFile<{ tweet: Tweet }[]>(tweetsContent);
  if (!tweets) {
    throw new Error("couldn't parse tweet.js");
  }

  let accountEntry: ZipEntry | null = null;
  for (const entry of Object.values(zipInfo.entries)) {
    if (entry.name.endsWith("/account.js")) {
      console.log("found account file in archive!");
      accountEntry = entry;
      break;
    }
  }
  if (!accountEntry) {
    throw new Error("account.js or account.js file not found in archive!");
  }

  const accountContent = new TextDecoder().decode(
    new Uint8Array(await accountEntry.arrayBuffer())
  );

  const account =
    parseTwitterArchiveFile<{ account: Account }[]>(accountContent);
  if (!account) {
    throw new Error("couldn't parse tweet.js");
  }

  return {
    account: account[0].account,
    tweets: tweets.map(({ tweet }) => tweet),
  };
};
