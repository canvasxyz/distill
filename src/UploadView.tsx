import React from "react";
import type { Tweet } from "./types";
import { unzip, type ZipEntry } from "unzipit";
import { parseTwitterArchiveFile } from "./twitterArchiveParser";

const processTwitterArchive = async (file: File): Promise<Tweet[]> => {
  // This is a stub method. Implement the logic to parse the Twitter archive zip file.
  // Once parsed, use setTweets to update the tweets state.
  console.log("Parsing Twitter archive:", file.name);
  const zipInfo = await unzip(file);
  let tweetEntry: ZipEntry | null = null;
  for (const entry of Object.values(zipInfo.entries)) {
    if (entry.name.endsWith("/tweet.js")) {
      console.log("found tweet file in archive!");
      tweetEntry = entry;
      break;
    }
  }
  if (!tweetEntry) {
    throw new Error("tweet.js file not found in archive!");
  }

  const content = new TextDecoder().decode(
    new Uint8Array(await tweetEntry.arrayBuffer())
  );

  const tweets = parseTwitterArchiveFile(content);
  if (!tweets) {
    throw new Error("couldn't parse tweet.js");
  }
  return tweets.map(({ tweet }) => tweet);
};

export function UploadView({
  setTweets,
}: {
  setTweets: (tweets: Tweet[]) => void;
}) {
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Stub method to parse the Twitter archive
      const tweets = await processTwitterArchive(file);
      setTweets(tweets);
    }
  };

  return (
    <div>
      <input type="file" accept=".zip" onChange={handleFileUpload} />
    </div>
  );
}
