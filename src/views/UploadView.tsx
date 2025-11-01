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
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-semibold text-slate-900">Open your archive</h1>
      <p className="mt-3 text-base leading-relaxed text-slate-700">
        To begin, open your archive. Use the ".zip" file that you received when
        you requested your archive from Twitter/X. The Archive Explorer will
        only look at the account.js, follower.js, following.js, profile.js and
        tweet(s).js files.
      </p>

      {ingestTwitterArchiveProgress == null ? (
        <div
          className="mt-5 cursor-pointer rounded-lg border-2 border-dashed border-blue-500/80 bg-slate-50 p-6 text-center text-blue-600 transition hover:bg-blue-50"
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
          <p className="m-0 text-sm font-medium text-blue-600">
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
        <div className="mt-5 rounded-lg border-2 border-dashed border-blue-200 bg-slate-50 p-6 text-center text-slate-600">
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

      <h3 className="text-xl font-semibold text-slate-900">
        ... or select a user from Community Archive
      </h3>
      {loadCommunityArchiveUserProgress ? (
        <div className="mt-3 space-y-1 text-sm font-medium text-slate-600">
          {loadCommunityArchiveUserProgress.status === "starting" && (
            <p>Starting download...</p>
          )}
          {loadCommunityArchiveUserProgress.status === "loadingTweets" && (
            <p>
              Loading tweets... (
              {loadCommunityArchiveUserProgress.tweetsLoaded}/
              {loadCommunityArchiveUserProgress.totalNumTweets})
            </p>
          )}
          {loadCommunityArchiveUserProgress.status === "loadingProfile" && (
            <p>Loading profile</p>
          )}

          {loadCommunityArchiveUserProgress.status === "loadingAccount" && (
            <p>Loading account</p>
          )}
          {loadCommunityArchiveUserProgress.status === "loadingFollower" && (
            <p>Loading followers</p>
          )}
          {loadCommunityArchiveUserProgress.status === "loadingFollowing" && (
            <p>Loading following</p>
          )}
          {loadCommunityArchiveUserProgress.status === "generatingTextIndex" && (
            <p>Generating text index</p>
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {(otherUserAccounts || []).map((account) => {
            const isPinned = pinnedSet.has(
              (account.username || "").toLowerCase(),
            );
            return (
              <div
                key={account.accountId}
                className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  {account.profile && account.profile.avatarMediaUrl ? (
                    <img
                      src={account.profile.avatarMediaUrl}
                      onError={(event) => {
                        event.currentTarget.src =
                          "https://www.community-archive.org/_next/image?url=%2Fplaceholder.jpg&w=3840&q=75";
                      }}
                      className="h-9 w-9 rounded-full border border-slate-300 object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-lg text-slate-500">
                      ?
                    </div>
                  )}
                  <div className="text-sm font-medium text-slate-800">
                    {account.username}
                  </div>
                </div>
                <div className="text-sm text-slate-600 sm:text-right">
                  {account.numTweets.toLocaleString()} tweets
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  {isPinned && (
                    <span
                      title="Pinned"
                      aria-label="Pinned account"
                      className="text-base text-amber-500"
                    >
                      ?
                    </span>
                  )}
                  <button
                    className="rounded-md border border-[#1976d2] bg-[#1976d2] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#145aa9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1976d2]"
                    onClick={() => selectCommunityArchiveUser(account.accountId)}
                  >
                    Select
                  </button>
                </div>
              </div>
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
