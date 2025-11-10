import { useEffect, useMemo, useState } from "react";
import { useStore } from "../state/store";
import { CommunityArchiveUserModal } from "../components/CommunityArchiveUserModal";
import { IngestArchive } from "../components/IngestArchive";
import { getCommunityArchiveUserProgressLabel } from "../components/CommunityArchiveUserProgress";
import { db } from "../db";
import type { ProfileWithId } from "../types";
import { ViewTweetsButton } from "../components/ViewTweetsButton";
import { UserSelectEntry } from "../components/UserSelectEntry";

export function SelectUser({
  selectedAccountId,
  setSelectedAccountId,
}: {
  selectedAccountId: string | null;
  setSelectedAccountId: (accountId: string) => void;
}) {
  const {
    accounts,
    allTweets,
    loadCommunityArchiveUserProgress,
    removeArchive,
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [profilesById, setProfilesById] = useState<
    Record<string, ProfileWithId>
  >({});

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
      if (isRt) prev.retweets += 1;
      else prev.tweets += 1;
      map.set(accId, prev);
    }
    return map;
  }, [allTweets]);

  return (
    <div>
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
          {accounts.map((acc) => (
            <div style={{ display: "flex", gap: "10px" }}>
              <UserSelectEntry
                acc={acc}
                profile={profilesById[acc.accountId]}
                onClick={() => setSelectedAccountId(acc.accountId)}
                onClickRemove={async () => {
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

                  if (selectedAccountId === acc.accountId && next?.accountId) {
                    setSelectedAccountId(next.accountId);
                  }
                }}
                isActive={
                  selectedAccountId
                    ? acc.accountId === selectedAccountId
                    : false
                }
                numTweets={
                  (countsByAccount.get(acc.accountId) || { tweets: 0 }).tweets
                }
                numRetweets={
                  (countsByAccount.get(acc.accountId) || { retweets: 0 })
                    .retweets
                }
              />

              <ViewTweetsButton account={acc} />
            </div>
          ))}
        </div>
      </div>

      <CommunityArchiveUserModal
        showModal={showModal}
        setShowModal={setShowModal}
      />
    </div>
  );
}
