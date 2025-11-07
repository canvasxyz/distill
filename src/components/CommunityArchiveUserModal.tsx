import { useMemo } from "react";
import {
  PINNED_USERNAMES,
  useCommunityArchiveAccounts,
} from "../hooks/useUsers";
import { useStore } from "../state/store";
import { Modal } from "./Modal";

export const CommunityArchiveUserModal = ({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}) => {
  const otherUserAccounts = useCommunityArchiveAccounts();

  const pinnedSet = useMemo(
    () => new Set(PINNED_USERNAMES.map((u) => u.toLowerCase())),
    [],
  );
  const { loadCommunityArchiveUser } = useStore();
  // Move the progress state inside the modal as well

  return (
    <Modal
      open={showModal}
      onClose={() => setShowModal(false)}
      title="Select a user from Community Archive"
    >
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
                  onClick={() => {
                    loadCommunityArchiveUser(account.accountId);
                    setShowModal(false);
                  }}
                >
                  Select
                </button>
              </div>
            </>
          );
        })}
      </div>
    </Modal>
  );
};
