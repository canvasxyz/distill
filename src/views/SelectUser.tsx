import { useEffect, useMemo, useState } from "react";
import { useStore } from "../state/store";
import { CommunityArchiveUserModal } from "../components/CommunityArchiveUserModal";
import { IngestArchive } from "../components/IngestArchive";
import { getCommunityArchiveUserProgressLabel } from "../components/CommunityArchiveUserProgress";
import { db } from "../db";
import type { ProfileWithId } from "../types";

export function SelectUser({
  selectedAccountId,
  setSelectedAccountId,
}: {
  selectedAccountId: string | null;
  setSelectedAccountId: (accountId: string) => void;
}) {
  const { accounts, allTweets, loadCommunityArchiveUserProgress, removeArchive } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileWithId>>({});
  const [hoveredAccountId, setHoveredAccountId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadProfiles = async () => {
      const profiles = await db.profiles.toArray();
      if (!cancelled) {
        const map: Record<string, ProfileWithId> = {};
        for (const p of profiles) map[p.accountId] = p;
        setProfilesById(map);
      }
    };
    loadProfiles();
    return () => {
      cancelled = true;
    };
  }, []);

  const countsByAccount = useMemo(() => {
    const map = new Map<string, { tweets: number; retweets: number }>();
    for (const t of allTweets) {
      const accId = t.account_id;
      const isRt = t.full_text && t.full_text.trim().startsWith("RT @");
      const prev = map.get(accId) || { tweets: 0, retweets: 0 };
      if (isRt) prev.retweets += 1; else prev.tweets += 1;
      map.set(accId, prev);
    }
    return map;
  }, [allTweets]);

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
            <h3 style={{ margin: 0 }}>Select an archive</h3>
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
                    setHoveredAccountId(acc.accountId);
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    setHoveredAccountId((prev) => (prev === acc.accountId ? null : prev));
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "#fff";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {(() => {
                      const profile = profilesById[acc.accountId];
                      const size = 28;
                      if (profile && profile.avatarMediaUrl) {
                        return (
                          <img
                            src={profile.avatarMediaUrl}
                            alt="avatar"
                            width={size}
                            height={size}
                            style={{
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                              border: isActive ? "1px solid #1976d2" : "1px solid #ddd",
                              background: "#fff",
                            }}
                          />
                        );
                      }
                      // Fallback placeholder
                      return (
                        <div
                          style={{
                            width: size,
                            height: size,
                            borderRadius: "50%",
                            background: "#e0e0e0",
                            border: isActive ? "1px solid #1976d2" : "1px solid #ddd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#666",
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {(acc.username || acc.accountDisplayName || "?")
                            .toUpperCase()
                            .slice(0, 1)}
                        </div>
                      );
                    })()}
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontWeight: 600, color: isActive ? "#1976d2" : "#555" }}>
                        {acc.username || acc.accountDisplayName || acc.accountId}{" "}
                        {acc.fromArchive && "(My archive)"}
                      </span>
                      {(() => {
                        const c = countsByAccount.get(acc.accountId) || {
                          tweets: 0,
                          retweets: 0,
                        };
                        return (
                          <span style={{ color: isActive ? "#1565c0" : "#777" }}>
                            {c.tweets} tweets · {c.retweets} retweets
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {
                      <button
                        type="button"
                        title="Remove archive"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = window.confirm(
                            "Remove this archive? This will delete the locally stored tweets and profile for this account.",
                          );
                          if (!ok) return;

                          const idx = accounts.findIndex(
                            (a) => a.accountId === acc.accountId,
                          );
                          const next =
                            (idx >= 0 && accounts[idx + 1]) ||
                            (idx > 0 && accounts[idx - 1]) ||
                            null;

                          await removeArchive(acc.accountId);

                          if (
                            selectedAccountId === acc.accountId &&
                            next?.accountId
                          ) {
                            setSelectedAccountId(next.accountId);
                          }
                        }}
                        style={{
                          width: 22,
                          height: 22,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 11,
                          border: "1px solid #ddd",
                          background: "#fff",
                          color: "#888",
                          cursor: "pointer",
                          opacity: hoveredAccountId === acc.accountId ? 1 : 0,
                          transition: "opacity 0.15s ease-in-out, background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f0f0f0";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fff";
                        }}
                      >
                        ×
                      </button>
                    }
                  </div>
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
