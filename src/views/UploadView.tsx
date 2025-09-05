import React from "react";
import type { Tweet } from "../types";
import { unzip, type ZipEntry } from "unzipit";
import { parseTwitterArchiveFile } from "../twitterArchiveParser";
import { useStore } from "../store";
import { Navigate } from "react-router";

const processTwitterArchive = async (file: File): Promise<Tweet[]> => {
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

  const content = new TextDecoder().decode(
    new Uint8Array(await tweetEntry.arrayBuffer())
  );

  const tweets = parseTwitterArchiveFile(content);
  if (!tweets) {
    throw new Error("couldn't parse tweet.js");
  }
  return tweets.map(({ tweet }) => tweet);
};

export function UploadView() {
  const { setTweets, tweets } = useStore();

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

  if (tweets !== null) {
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
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file && file.type === "application/zip") {
            const tweets = await processTwitterArchive(file);
            setTweets(tweets);
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
          type="file"
          accept=".zip"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
