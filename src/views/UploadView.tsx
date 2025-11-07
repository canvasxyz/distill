import { useRef, useState, type ReactNode } from "react";
import { useStore } from "../state/store";
import { Navigate } from "react-router";
import {
  useCommunityArchiveAccounts,
  PINNED_USERNAMES,
} from "../hooks/useUsers";
import { useMemo } from "react";

// Simple Modal component (no dependency on libraries)
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflowY: "auto",
      }}
      onClick={onClose}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          minWidth: 340,
          maxWidth: 600,
          maxHeight: "calc(100vh - 80px)",
          background: "#fff",
          borderRadius: 10,
          padding: "24px 22px 18px 22px",
          boxShadow: "0 2px 32px 0 rgba(0,0,48,0.12)",
          position: "relative",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <h2 style={{ fontSize: "1.25rem", margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.45rem",
              cursor: "pointer",
              color: "#888",
              padding: 0,
              margin: 0,
              minWidth: 30,
            }}
            tabIndex={0}
          >
            ×
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function UploadPanel() {
  const {
    ingestTwitterArchive,
    ingestTwitterArchiveProgress,
    loadCommunityArchiveUser,
    loadCommunityArchiveUserProgress,
    accounts,
    switchAccount,
    activeAccountId,
  } = useStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const otherUserAccounts = useCommunityArchiveAccounts();
  const pinnedSet = useMemo(
    () => new Set(PINNED_USERNAMES.map((u) => u.toLowerCase())),
    [],
  );

  // showModal: control Community Archive modal open state
  const [showModal, setShowModal] = useState(false);

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
    setShowModal(false);
  };

  // Move the progress state inside the modal as well
  const renderCommunityArchiveContent = () => {
    if (loadCommunityArchiveUserProgress) {
      return (
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
      );
    }
    return (
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
                  onClick={() => selectCommunityArchiveUser(account.accountId)}
                >
                  Select
                </button>
              </div>
            </>
          );
        })}
      </div>
    );
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
      {accounts.length > 0 && (
        <div
          style={{
            marginBottom: "30px",
            padding: "16px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "12px" }}>
            Switch to loaded account
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {accounts.map((acc) => {
              const isActive = acc.accountId === activeAccountId;
              return (
                <div
                  key={acc.accountId}
                  onClick={async () => {
                    if (!isActive) {
                      await switchAccount(acc.accountId);
                    }
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    cursor: isActive ? "default" : "pointer",
                    backgroundColor: isActive ? "#e3f2fd" : "#fff",
                    border: isActive ? "1px solid #1976d2" : "1px solid #ddd",
                    color: isActive ? "#1976d2" : "#333",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "#fff";
                    }
                  }}
                >
                  <span style={{ fontWeight: isActive ? 600 : 400 }}>
                    {acc.username || acc.accountDisplayName || acc.accountId}
                    {isActive && " (active)"}
                  </span>
                  {!isActive && (
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      Click to switch →
                    </span>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                marginTop: 12,
                marginBottom: 10,
                padding: "8px 16px",
                color: "#fff",
                background: "#1976d2",
                border: "none",
                borderRadius: "6px",
                fontWeight: 500,
                fontSize: "15px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              ... or select a user from Community Archive
            </button>
          </div>
        </div>
      )}
      {/* Community Archive modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Select a user from Community Archive"
      >
        {renderCommunityArchiveContent()}
      </Modal>
    </div>
  );
}

export function UploadView() {
  const { allTweets, activeAccountId } = useStore();

  // Only redirect if we have tweets for the active account
  // If activeAccountId exists but no tweets, show upload view to allow switching
  if (allTweets && allTweets.length > 0 && activeAccountId) {
    return <Navigate to="/" />;
  }

  return <UploadPanel />;
}
