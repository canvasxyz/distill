import { useState } from "react";
import { useStore } from "../state/store";
import { CommunityArchiveUserModal } from "../components/CommunityArchiveUserModal";
import { IngestArchive } from "../components/IngestArchive";
import { getCommunityArchiveUserProgressLabel } from "../components/CommunityArchiveUserProgress";

export function SelectUser({
  selectedAccountId,
  setSelectedAccountId,
}: {
  selectedAccountId: string | null;
  setSelectedAccountId: (accountId: string) => void;
}) {
  const { accounts, loadCommunityArchiveUserProgress } = useStore();

  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      {accounts.length > 0 && (
        <div style={{}}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <h3 style={{ margin: 0 }}>Select a user to query</h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <IngestArchive variant="compact" />
              {loadCommunityArchiveUserProgress ? (
                <button
                  type="button"
                  disabled={true}
                  style={{
                    padding: "8px 16px",
                    color: "#fff",
                    background: "#757575",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 500,
                    fontSize: "15px",
                    outline: "none",
                  }}
                >
                  {getCommunityArchiveUserProgressLabel(
                    loadCommunityArchiveUserProgress,
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  style={{
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
                  Select from Community Archive
                </button>
              )}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {accounts.map((acc) => {
              const isActive =
                selectedAccountId && acc.accountId === selectedAccountId;

              return (
                <div
                  key={acc.accountId}
                  onClick={async () => {
                    setSelectedAccountId(acc.accountId);
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
                    {acc.username || acc.accountDisplayName || acc.accountId}{" "}
                    {acc.fromArchive && "(My archive)"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {accounts.length === 0 && <IngestArchive />}

      <CommunityArchiveUserModal
        showModal={showModal}
        setShowModal={setShowModal}
      />
    </div>
  );
}
