import type { Account, Tweet, Profile, ProfileWithId } from "./types";
import { unzip } from "unzipit";
import { parseTwitterArchiveFile } from "./twitterArchiveParser";

export const processTwitterArchive = async (
  file: File,
): Promise<{
  account: Account;
  profile: ProfileWithId;
  tweets: Tweet[];
}> => {
  const zipInfo = await unzip(file);

  const fileNamesToExtract = [
    "account.js",
    "profile.js",
    "tweet.js",
    "tweets.js",
  ];

  let account;
  let profile;
  let tweets;

  for (const entry of Object.values(zipInfo.entries)) {
    const entryNameParts = entry.name.split("/");
    const lastEntryNamePart = entryNameParts[entryNameParts.length - 1];

    if (fileNamesToExtract.includes(lastEntryNamePart)) {
      const content = new TextDecoder().decode(
        new Uint8Array(await entry.arrayBuffer()),
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
        profile = (parsedData as { profile: Profile }[])[0].profile;
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

  const profileWithId = { ...profile, accountId: account.accountId };

  return {
    account,
    profile: profileWithId,
    tweets,
  };
};
