import { v7 as uuidv7 } from "uuid";
import type {
  Account,
  Tweet,
  Profile,
  ProfileWithId,
  Following,
  Follower,
} from "./types";
import { unzip } from "unzipit";
import { parseTwitterArchiveFile } from "./twitterArchiveParser";

export const processTwitterArchive = async (
  file: File
): Promise<{
  account: Account;
  profile: ProfileWithId;
  tweets: Tweet[];
  following: Following[];
  follower: Follower[];
}> => {
  // This is a stub method. Implement the logic to parse the Twitter archive zip file.
  // Once parsed, use setTweets to update the tweets state.
  console.log("Parsing Twitter archive:", file.name);
  const zipInfo = await unzip(file);

  const fileNamesToExtract = [
    "account.js",
    "profile.js",
    "tweet.js",
    "tweets.js",
    "following.js",
    "follower.js",
  ];

  let account;
  let profile;
  let tweets;
  let following;
  let follower;

  for (const entry of Object.values(zipInfo.entries)) {
    const entryNameParts = entry.name.split("/");
    const lastEntryNamePart = entryNameParts[entryNameParts.length - 1];

    if (fileNamesToExtract.includes(lastEntryNamePart)) {
      const content = new TextDecoder().decode(
        new Uint8Array(await entry.arrayBuffer())
      );

      const parsedData = parseTwitterArchiveFile(content);
      if (!parsedData) {
        throw new Error(`couldn't parse ${lastEntryNamePart}`);
      }

      if (
        lastEntryNamePart === "tweet.js" ||
        lastEntryNamePart === "tweets.js"
      ) {
        tweets = (parsedData as { tweet: Tweet }[]).map((entry) => entry.tweet);
      } else if (lastEntryNamePart === "account.js") {
        account = (parsedData as { account: Account }[])[0].account;
      } else if (lastEntryNamePart === "profile.js") {
        const profileId = uuidv7();
        profile = {
          ...(parsedData as { profile: Profile }[])[0].profile,
          profileId,
        };
      } else if (lastEntryNamePart === "following.js") {
        // add following
        following = (parsedData as { following: Following }[]).map(
          (entry) => entry.following
        );
      } else if (lastEntryNamePart === "follower.js") {
        // add follower
        follower = (parsedData as { follower: Follower }[]).map(
          (entry) => entry.follower
        );
      }
    }
  }

  if (!account) {
    throw new Error("Couldn't extract account data");
  }
  if (!profile) {
    throw new Error("Couldn't extract profile data");
  }
  if (tweets === undefined) {
    throw new Error("Couldn't extract tweets data");
  }
  if (following === undefined) {
    throw new Error("Couldn't extract following data");
  }
  if (follower === undefined) {
    throw new Error("Couldn't extract follower data");
  }

  return {
    account,
    profile,
    tweets,
    following,
    follower,
  };
};
