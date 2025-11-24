import type { Account, Tweet, Profile, ProfileWithId } from "./types";
import { unzip } from "unzipit";
import { parseTwitterArchiveFile } from "./twitterArchiveParser";
import { archiveLog, archiveWarn } from "./archiveUploadLogger";

export const processTwitterArchive = async (
  file: File,
): Promise<{
  account: Account;
  profile: ProfileWithId;
  tweets: Tweet[];
}> => {
  archiveLog("Unzipping archive", { name: file.name, size: file.size });
  const zipInfo = await unzip(file);
  const entryNames = Object.values(zipInfo.entries).map((entry) => entry.name);
  archiveLog("Archive entries discovered", {
    entryCount: entryNames.length,
    entries: entryNames.slice(0, 10),
  });

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
      archiveLog("Parsing archive entry", {
        fullEntryName: entry.name,
        entryType: lastEntryNamePart,
      });
      const content = new TextDecoder().decode(
        new Uint8Array(await entry.arrayBuffer()),
      );

      const parsedData = parseTwitterArchiveFile(content);
      if (!parsedData) {
        archiveWarn("Failed to parse archive entry", {
          entryType: lastEntryNamePart,
        });
        throw new Error(`couldn't parse ${lastEntryNamePart}`);
      }

      if (
        lastEntryNamePart === "tweet.js" ||
        lastEntryNamePart === "tweets.js"
      ) {
        tweets = (parsedData as { tweet: Tweet }[]).map((entry) => entry.tweet);
        archiveLog("Tweets extracted from archive entry", {
          entryType: lastEntryNamePart,
          tweetCount: tweets.length,
        });
      } else if (lastEntryNamePart === "account.js") {
        account = (parsedData as { account: Account }[])[0].account;
        archiveLog("Account extracted from archive", {
          accountId: account.accountId,
        });
      } else if (lastEntryNamePart === "profile.js") {
        profile = (parsedData as { profile: Profile }[])[0].profile;
        archiveLog("Profile extracted from archive", {
          entryType: lastEntryNamePart,
        });
      }
    }
  }

  if (!account) {
    archiveWarn("Archive missing account data");
    throw new Error("Couldn't extract account data");
  }
  if (!profile) {
    archiveWarn("Archive missing profile data");
    throw new Error("Couldn't extract profile data");
  }
  if (tweets === undefined) {
    archiveWarn("Archive missing tweets data");
    throw new Error("Couldn't extract tweets data");
  }

  const profileWithId = { ...profile, accountId: account.accountId };

  return {
    account,
    profile: profileWithId,
    tweets,
  };
};
