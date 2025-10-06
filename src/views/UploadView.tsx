import React, { useRef } from "react";
import type { Account, Tweet } from "../types";
import { unzip, type ZipEntry } from "unzipit";
import { parseTwitterArchiveFile } from "../twitterArchiveParser";
import { useStore } from "../store";
import { Navigate } from "react-router";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

const processTwitterArchive = async (
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

export function UploadView() {
  const { setAccount, setTweets } = useStore();
  const tweets = useLiveQuery(() => db.tweets.toArray());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Stub method to parse the Twitter archive
      const { account, tweets } = await processTwitterArchive(file);
      await setAccount(account);
      await setTweets(tweets);
    }
  };

  if (tweets && tweets.length > 0) {
    return <Navigate to="/" />;
  }

  return (
    <div
      style={{
        maxWidth: "768px",
        margin: "auto",
        border: "1px solid black",
        padding: "20px",
        marginTop: "100px",
        borderRadius: "10px",
      }}
    >
      <h1>Open your archive</h1>
      <p>
        To begin, open your archive. Use the ".zip" file that you received when
        you requested your archive from Twitter/X. The Tweet Archive Explorer
        will only look at the tweet(s).js and account.js file.
      </p>
      <div
        style={{
          textAlign: "center",
          marginTop: "20px",
          padding: "20px",
          border: "2px dashed #007bff",
          borderRadius: "5px",
          backgroundColor: "#f9f9f9",
          cursor: "pointer",
          transition: "background-color 0.2s",
        }}
        onClick={() => {
          fileInputRef.current!.click();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file && file.type === "application/zip") {
            const { account, tweets } = await processTwitterArchive(file);
            await setAccount(account);
            await setTweets(tweets);
          }
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#e0e0e0")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#f9f9f9")
        }
      >
        <p style={{ margin: "0", color: "#007bff" }}>
          Drag and drop your Twitter archive (.zip) here or click to open.
        </p>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
