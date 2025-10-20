import React, { useRef } from "react";
import { useStore } from "../state/store";
import { Navigate } from "react-router";

export function UploadView() {
  const { allTweets, ingestTwitterArchive } = useStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await ingestTwitterArchive(file);
    }
  };

  if (allTweets && allTweets.length > 0) {
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
        you requested your archive from Twitter/X. The Twitter Archive Explorer
        will only look at the account.js, follower.js, following.js, profile.js
        and tweet(s).js files.
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
            await ingestTwitterArchive(file);
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
