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
    <div className="max-w-[768px] mx-auto p-5 rounded-[10px]">
      <h1>Open your archive</h1>
      <p>
        To begin, open your archive. Use the ".zip" file that you received when
        you requested your archive from Twitter/X. The Archive Explorer will
        only look at the account.js, follower.js, following.js, profile.js and
        tweet(s).js files.
      </p>

      {ingestTwitterArchiveProgress == null ? (
        <div
          className="text-center mt-5 p-5 border-2 border-dashed border-blue-500 rounded-[5px] bg-[#f9f9f9] cursor-pointer transition-colors duration-200 hover:bg-[#e0e0e0]"
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
        >
          <p className="m-0 text-blue-500">
            Drag and drop your Twitter archive (.zip) here or click to open.
          </p>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div className="text-center mt-5 p-5 border-2 border-dashed border-[rgb(190,222,255)] rounded-[5px] bg-[#f9f9f9]">
          {ingestTwitterArchiveProgress.status === "processingArchive" &&
            "Processing archive..."}
          {ingestTwitterArchiveProgress.status === "addingAccount" &&
            "Adding account"}
          {ingestTwitterArchiveProgress.status === "addingFollowers" &&
            "Adding followers"}
          {ingestTwitterArchiveProgress.status === "addingFollowing" &&
            "Adding following"}
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
          {loadCommunityArchiveUserProgress.status === "loadingFollower" &&
            "Loading followers"}
          {loadCommunityArchiveUserProgress.status === "loadingFollowing" &&
            "Loading following"}
          {loadCommunityArchiveUserProgress.status === "generatingTextIndex" &&
            "Generating text index"}
        </>
      ) : (
        <div className="grid grid-cols-3 gap-2 mt-4 items-center">
          {(otherUserAccounts || []).map((account, idx) => {
            const isPinned = pinnedSet.has(
              (account.username || "").toLowerCase(),
            );
            return (
              <>
                <div key={`avatar-${idx}`} className="flex items-center">
                  {account.profile && account.profile.avatarMediaUrl ? (
                    <img
                      src={account.profile.avatarMediaUrl}
                      onError={(e) =>
                        // @ts-expect-error "..."
                        (e.target.src =
                          "https://www.community-archive.org/_next/image?url=%2Fplaceholder.jpg&w=3840&q=75")
                      }
                      className="w-9 h-9 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-xl text-gray-500">
                      ?
                    </div>
                  )}
                  <div className="ml-[10px]">{account.username}</div>
                </div>
                <div key={`tweets-${idx}`} className="text-center">
                  {account.numTweets.toLocaleString()}
                </div>
                <div key={`select-${idx}`} className="flex justify-end items-center gap-[6px]">
                  {isPinned && (
                    <span
                      title="Pinned"
                      aria-label="Pinned account"
                      className="text-[#f5b301] text-sm leading-none mr-1"
                    >
                      ★
                    </span>
                  )}
                  <button
                    className="py-1 px-[10px] rounded-[5px] border border-[#1976d2] bg-[#1976d2] text-white cursor-pointer font-medium"
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
