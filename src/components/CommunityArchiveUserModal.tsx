import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router";
import { Avatar, DropdownMenu, Spinner } from "@radix-ui/themes";
import {
  PINNED_USERNAMES,
  useCommunityArchiveAccounts,
} from "../hooks/useUsers";
import { useSelectedAccount } from "../hooks/useSelectedAccount";
import { useStore } from "../state/store";
import { db } from "../db";
import { Modal } from "./Modal";
import { ArchiveDropZone } from "./ArchiveDropZone";
import { getCommunityArchiveUserProgressLabel } from "./CommunityArchiveUserProgress";

export function CommunityArchiveUserModal({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [fullHistory, setFullHistory] = useState(false);
  const [loadingPerson, setLoadingPerson] = useState("");
  const [loadError, setLoadError] = useState("");
  const { selectedAccountId, setSelectedAccountId } = useSelectedAccount();
  const {
    accounts: savedAccounts,
    allTweets,
    removeArchive,
    loadCommunityArchiveUser,
    loadCommunityArchiveUserProgress,
    ingestTwitterArchiveProgress,
  } = useStore();
  const profiles = useLiveQuery(() => db.profiles.toArray(), [], []);
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    allTweets.forEach((t) =>
      result.set(t.account_id, (result.get(t.account_id) ?? 0) + 1),
    );
    return result;
  }, [allTweets]);
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedQuery(query.trim()),
      250,
    );
    return () => window.clearTimeout(timeout);
  }, [query]);
  const {
    accounts,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    retry,
  } = useCommunityArchiveAccounts(showModal, debouncedQuery);
  const busy =
    !!loadCommunityArchiveUserProgress || !!ingestTwitterArchiveProgress;
  const searchPending = query.trim() !== debouncedQuery;
  const savedMatches = savedAccounts.filter((a) =>
    `${a.username} ${a.accountDisplayName}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const newAccounts = accounts.filter(
    (a) => !savedAccounts.some((s) => s.accountId === a.accountId),
  );
  const featured = new Set(PINNED_USERNAMES.map((name) => name.toLowerCase()));
  const sections = [
    {
      title: "A few people to start with",
      people: newAccounts.filter((a) => featured.has(a.username.toLowerCase())),
    },
    {
      title: "Community Archive",
      people: newAccounts.filter(
        (a) => !featured.has(a.username.toLowerCase()),
      ),
    },
  ];
  async function loadPerson(id: string, username: string, limit?: number) {
    if (busy) return;
    setLoadError("");
    setLoadingPerson(username);
    try {
      await loadCommunityArchiveUser(id, limit);
      setSelectedAccountId(id);
      setShowModal(false);
    } catch {
      useStore.setState({ loadCommunityArchiveUserProgress: null });
      setLoadError(`@${username} couldn’t be loaded. Please try again.`);
    } finally {
      setLoadingPerson("");
    }
  }
  async function removePerson(id: string) {
    if (
      !window.confirm(
        "Remove this archive? This will delete the locally stored tweets and profile for this account.",
      )
    )
      return;
    try {
      await removeArchive(id);
    } catch {
      setLoadError("Couldn’t remove this archive. Please try again.");
    }
  }
  return (
    <Modal
      open={showModal}
      onClose={() => setShowModal(false)}
      title="Who are you curious about?"
      initialFocus="#people-search"
    >
      <div className="people-picker">
        <p className="quiet-note">
          Yourself, a friend, someone whose tweets stuck with you. Public
          archives are shared voluntarily through{" "}
          <a
            href="https://www.community-archive.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Community Archive ↗
          </a>
          .
        </p>
        <label className="visually-hidden" htmlFor="people-search">
          Search people
        </label>
        <input
          id="people-search"
          className="people-search"
          placeholder="Find a person by name or @handle…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loadError && (
          <p role="alert" className="archive-upload-error">
            {loadError}
          </p>
        )}
        <div className="people-results" aria-busy={busy}>
          {savedMatches.length > 0 && (
            <section aria-label="Already here">
              <h3>Already here</h3>
              {savedMatches.map((a) => (
                <div className="person-row" key={a.accountId}>
                  <button
                    className="person-row-select"
                    disabled={busy}
                    aria-label={`Select @${a.username}`}
                    aria-pressed={a.accountId === selectedAccountId}
                    onClick={() => {
                      setSelectedAccountId(a.accountId);
                      setShowModal(false);
                    }}
                  >
                    <Avatar
                      src={
                        profiles.find((p) => p.accountId === a.accountId)
                          ?.avatarMediaUrl
                      }
                      size="2"
                      radius="full"
                      fallback={(a.accountDisplayName || a.username).slice(
                        0,
                        1,
                      )}
                    />
                    <span>
                      <strong>{a.accountDisplayName || a.username}</strong>
                      <small>
                        @{a.username} ·{" "}
                        {(counts.get(a.accountId) ?? 0).toLocaleString()} loaded
                        posts{a.fromArchive ? " · Your import" : ""}
                      </small>
                    </span>
                    <span aria-hidden="true">
                      {a.accountId === selectedAccountId ? "✓" : "↗"}
                    </span>
                  </button>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <button
                        className="plain-button person-menu"
                        disabled={busy}
                        aria-label={`Manage @${a.username} archive`}
                      >
                        •••
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item asChild>
                        <Link
                          to={`/all-tweets?account_id=${encodeURIComponent(a.accountId)}`}
                          onClick={() => setShowModal(false)}
                        >
                          Browse posts
                        </Link>
                      </DropdownMenu.Item>
                      {!a.fromArchive && (
                        <DropdownMenu.Item
                          onSelect={() =>
                            void loadPerson(a.accountId, a.username)
                          }
                        >
                          Refresh full archive
                        </DropdownMenu.Item>
                      )}
                      <DropdownMenu.Item
                        color="red"
                        onSelect={() => void removePerson(a.accountId)}
                      >
                        Remove @{a.username} archive
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              ))}
            </section>
          )}
          <div className="archive-load-choice">
            <label htmlFor="archive-amount">When loading someone new</label>
            <select
              id="archive-amount"
              value={fullHistory ? "full" : "recent"}
              disabled={busy}
              onChange={(e) => setFullHistory(e.target.value === "full")}
            >
              <option value="recent">Latest 10,000 posts</option>
              <option value="full">Full archive · takes longer</option>
            </select>
            <small>
              This is what gets loaded, not how many posts each answer uses.
            </small>
          </div>
          {isLoading || searchPending ? (
            <p className="people-status" role="status">
              <Spinner /> Finding people…
            </p>
          ) : (
            sections.map(
              (section) =>
                section.people.length > 0 && (
                  <section key={section.title} aria-label={section.title}>
                    <h3>{section.title}</h3>
                    {section.people.map((a) => (
                      <div className="person-row" key={a.accountId}>
                        <button
                          className="person-row-select"
                          disabled={busy}
                          aria-label={`Load @${a.username}, ${fullHistory ? "full archive" : "latest 10,000 posts"}`}
                          onClick={() =>
                            void loadPerson(
                              a.accountId,
                              a.username,
                              fullHistory ? undefined : 10000,
                            )
                          }
                        >
                          <Avatar
                            src={a.profile?.avatarMediaUrl}
                            size="2"
                            radius="full"
                            fallback={a.username.slice(0, 1).toUpperCase()}
                          />
                          <span>
                            <strong>@{a.username}</strong>
                            <small>
                              {a.numTweets == null
                                ? "Post count unavailable"
                                : `${a.numTweets.toLocaleString()} available posts`}
                            </small>
                          </span>
                          <span aria-hidden="true">↗</span>
                        </button>
                        {loadingPerson === a.username && (
                          <p className="person-loading" role="status">
                            <Spinner /> Loading @{a.username}…{" "}
                            {loadCommunityArchiveUserProgress &&
                              getCommunityArchiveUserProgressLabel(
                                loadCommunityArchiveUserProgress,
                              )}
                          </p>
                        )}
                      </div>
                    ))}
                  </section>
                ),
            )
          )}
          {!isLoading &&
            !searchPending &&
            !newAccounts.length &&
            !savedMatches.length && (
              <p className="quiet-note">
                {error ||
                  (query
                    ? `No people match “${query.trim()}”.`
                    : "No public archives found. You can still import your own.")}
              </p>
            )}
          {error && (newAccounts.length > 0 || savedMatches.length > 0) && (
            <p role="alert" className="archive-upload-error">
              {error}
            </p>
          )}
          {(hasMore || error) && (
            <button
              className="plain-button"
              disabled={isLoadingMore || busy}
              onClick={() => (error ? retry() : void loadMore())}
            >
              {isLoadingMore
                ? "Finding more…"
                : error
                  ? "Try again"
                  : "More people ↓"}
            </button>
          )}
          {loadingPerson &&
            !newAccounts.some((a) => a.username === loadingPerson) && (
              <p role="status">Refreshing @{loadingPerson}…</p>
            )}
        </div>
        <div className="people-import">
          <span>Or use your own Twitter/X .zip</span>
          <ArchiveDropZone onImported={() => setShowModal(false)} />
        </div>
      </div>
    </Modal>
  );
}
