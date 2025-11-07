import React, { useRef } from "react";
import { useStore } from "../state/store";
import { Navigate } from "react-router";
import {
  useCommunityArchiveAccounts,
  PINNED_USERNAMES,
} from "../hooks/useUsers";
import { useMemo } from "react";

export function UploadPanel() {
  const {
    ingestTwitterArchive,
    ingestTwitterArchiveProgress,
    loadCommunityArchiveUser,
    loadCommunityArchiveUserProgress,
  } = useStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const otherUserAccounts = useCommunityArchiveAccounts();
  const pinnedSet = useMemo(
    () => new Set(PINNED_USERNAMES.map((u) => u.toLowerCase())),
    [],
  );

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await ingestTwitterArchive(file);
    }
  };

  const selectCommunityArchiveUser = (accountId: string) => {
    // call something in the store
    loadCommunityArchiveUser(accountId);
  };

  return (
    <div
      style={{
        maxWidth: "768px",
        margin: "auto",
        padding: "20px",
        borderRadius: "10px",
      }}
    >
      <h1>Open your archive</h1>
      <p>
        To begin, open the ".zip" file that you received when you requested your
        archive. The Archive Explorer only looks at the account.js, profile.js
        and tweets.js files.
      </p>
      <p>
        Only data from tweets.js leaves your browser during LLM queries. We do
        not log your queries, and most providers we use also follow a no-log
        policy.
      </p>

      {ingestTwitterArchiveProgress == null ? (
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
            fileInputRef.current?.click();
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
      ) : (
        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            padding: "20px",
            border: "2px dashed rgb(190, 222, 255)",
            borderRadius: "5px",
            backgroundColor: "#f9f9f9",
          }}
        >
          {ingestTwitterArchiveProgress.status === "processingArchive" &&
            "Processing archive..."}
          {ingestTwitterArchiveProgress.status === "addingAccount" &&
            "Adding account"}
          {ingestTwitterArchiveProgress.status === "addingProfile" &&
            "Adding profile"}
          {ingestTwitterArchiveProgress.status === "addingTweets" &&
            "Adding tweets"}
          {ingestTwitterArchiveProgress.status === "applyingFilters" &&
            "Applying filters"}
          {ingestTwitterArchiveProgress.status === "generatingTextIndex" &&
            "Generating text index"}
        </div>
      )}
      <br />

      <h3>... or select a user from Community Archive</h3>
      {loadCommunityArchiveUserProgress ? (
        <>
          {loadCommunityArchiveUserProgress.status === "starting" &&
            "Starting download..."}
          {loadCommunityArchiveUserProgress.status === "loadingTweets" &&
            `Loading tweets... (${loadCommunityArchiveUserProgress.tweetsLoaded}/${loadCommunityArchiveUserProgress.totalNumTweets})`}
          {loadCommunityArchiveUserProgress.status === "loadingProfile" &&
            "Loading profile"}

          {loadCommunityArchiveUserProgress.status === "loadingAccount" &&
            "Loading account"}
          {loadCommunityArchiveUserProgress.status === "generatingTextIndex" &&
            "Generating text index"}
        </>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "8px",
            marginTop: "16px",
            alignItems: "center",
          }}
        >
          {(otherUserAccounts || []).map((account, idx) => {
            const isPinned = pinnedSet.has(
              (account.username || "").toLowerCase(),
            );
            return (
              <>
                <div
                  key={`avatar-${idx}`}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  {account.profile && account.profile.avatarMediaUrl ? (
                    <img
                      src={account.profile.avatarMediaUrl}
                      onError={(e) =>
                        // @ts-expect-error "..."
                        (e.target.src =
                          "https://www.community-archive.org/_next/image?url=%2Fplaceholder.jpg&w=3840&q=75")
                      }
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid #ccc",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: "#ddd",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        color: "#888",
                      }}
                    >
                      ?
                    </div>
                  )}
                  <div style={{ marginLeft: 10 }}>{account.username}</div>
                </div>
                <div key={`tweets-${idx}`} style={{ textAlign: "center" }}>
                  {account.numTweets.toLocaleString()}
                </div>
                <div
                  key={`select-${idx}`}
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {isPinned && (
                    <span
                      title="Pinned"
                      aria-label="Pinned account"
                      style={{
                        color: "#f5b301",
                        fontSize: "14px",
                        lineHeight: 1,
                        marginRight: 4,
                      }}
                    >
                      ★
                    </span>
                  )}
                  <button
                    style={{
                      padding: "4px 10px",
                      borderRadius: "5px",
                      border: "1px solid #1976d2",
                      background: "#1976d2",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                    onClick={() =>
                      selectCommunityArchiveUser(account.accountId)
                    }
                  >
                    Select
                  </button>
                </div>
              </>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function UploadView() {
  const { allTweets } = useStore();

  if (allTweets && allTweets.length > 0) {
    return <Navigate to="/" />;
  }

  return <UploadPanel />;
}
