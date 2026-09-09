import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useLocation, useNavigate } from "react-router";
import { Avatar, DropdownMenu, Spinner } from "@radix-ui/themes";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from "@radix-ui/react-icons";
import type { Account } from "../types";
import {
  PINNED_USERNAMES,
  useCommunityArchiveAccounts,
} from "../hooks/useUsers";
import { useSelectedAccount } from "../hooks/useSelectedAccount";
import { useStore } from "../state/store";
import { db } from "../db";
import { PageContent } from "../components/PageContent";
import { ArchiveDropZone } from "../components/ArchiveDropZone";

function SavedPerson({
  account,
  avatarUrl,
  storedPostCount,
  current = false,
  disabled,
  onSelect,
  onRemove,
}: {
  account: Account;
  avatarUrl?: string;
  storedPostCount: number;
  current?: boolean;
  disabled: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const totalPosts = account.fromArchive
    ? storedPostCount
    : (account.numTweets ?? null);
  const identity = (
    <>
      <Avatar
        src={avatarUrl}
        size="2"
        radius="full"
        fallback={(account.accountDisplayName || account.username).slice(0, 1)}
      />
      <span className="person-row-text">
        <strong>{account.accountDisplayName || account.username}</strong>
        <small>
          <span className="person-username">@{account.username}</span>
          {totalPosts != null && ` · ${totalPosts.toLocaleString()} posts`}
          {account.fromArchive ? " · Your import" : " · Community Archive"}
        </small>
      </span>
    </>
  );
  return (
    <div className={`person-row${current ? " current-person-card" : ""}`}>
      {current ? (
        <div className="current-person-identity">{identity}</div>
      ) : (
        <button
          className="person-row-select"
          disabled={disabled}
          aria-label={`Select @${account.username}`}
          onClick={onSelect}
        >
          {identity}
          <ChevronRightIcon aria-hidden="true" />
        </button>
      )}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <button
            className="plain-button person-menu"
            disabled={disabled}
            aria-label={`Manage @${account.username} archive`}
          >
            •••
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item asChild>
            <Link
              to={`/all-tweets?account_id=${encodeURIComponent(account.accountId)}`}
            >
              Browse posts
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item color="red" onSelect={onRemove}>
            Remove @{account.username} archive
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
}

export function PeopleView() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { peopleFrom?: string } | null)?.peopleFrom;
  const hasOrigin =
    typeof from === "string" && /^\/(?!\/|people(?:[/?]|$))/.test(from);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const returnToWorkspace = () => {
    if (!mounted.current) return;
    if (hasOrigin) navigate(-1);
    else navigate("/", { replace: true });
  };
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [addingPerson, setAddingPerson] = useState("");
  const [addError, setAddError] = useState("");
  const [failedPerson, setFailedPerson] = useState("");
  const { selectedAccountId, setSelectedAccountId } = useSelectedAccount();
  const {
    accounts: savedAccounts,
    allTweets,
    removeArchive,
    addCommunityArchiveUser,
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
  } = useCommunityArchiveAccounts(true, debouncedQuery);
  const busy = !!addingPerson || !!ingestTwitterArchiveProgress;
  const searchPending = query.trim() !== debouncedQuery;
  const currentAccount = savedAccounts.find(
    (a) => a.accountId === selectedAccountId,
  );
  const savedMatches = savedAccounts.filter(
    (a) =>
      a.accountId !== selectedAccountId &&
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
  // Choosing someone only saves who they are. Their posts are fetched the
  // first time a question or avatar needs them.
  async function choosePerson(
    id: string,
    username: string,
    numTweets: number | null,
  ) {
    if (busy) return;
    setAddError("");
    setFailedPerson("");
    setAddingPerson(username);
    try {
      await addCommunityArchiveUser(id, numTweets);
      setSelectedAccountId(id);
      returnToWorkspace();
    } catch {
      setFailedPerson(username);
      setAddError(`@${username} couldn’t be added. Please try again.`);
    } finally {
      setAddingPerson("");
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
      setFailedPerson("");
      await removeArchive(id);
    } catch {
      setAddError("Couldn’t remove this archive. Please try again.");
    }
  }
  const savedPerson = (account: Account, current = false) => (
    <SavedPerson
      key={account.accountId}
      account={account}
      current={current}
      disabled={busy}
      avatarUrl={
        profiles.find((p) => p.accountId === account.accountId)?.avatarMediaUrl
      }
      storedPostCount={counts.get(account.accountId) ?? 0}
      onSelect={() => {
        setSelectedAccountId(account.accountId);
        returnToWorkspace();
      }}
      onRemove={() => void removePerson(account.accountId)}
    />
  );
  return (
    <PageContent>
      <div className="people-picker">
        <div className="people-page-actions">
          <button className="plain-button" onClick={returnToWorkspace}>
            <ArrowLeftIcon aria-hidden="true" />
            Back
          </button>
          <div className="people-import">
            <ArchiveDropZone onImported={returnToWorkspace} />
          </div>
        </div>
        <header className="page-intro">
          <h1>Who are you curious about?</h1>
          <p className="intro-copy">
            Yourself, a friend, someone whose tweets stuck with you. Public
            archives are shared voluntarily through{" "}
            <a
              href="https://www.community-archive.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Community Archive
              <ExternalLinkIcon className="inline-icon" aria-hidden="true" />
            </a>
            . Their posts are fetched when you first ask about them.
          </p>
        </header>
        {currentAccount && (
          <section
            className="current-person-section"
            aria-labelledby="current-person-title"
          >
            <h3 id="current-person-title">Currently curious about</h3>
            {savedPerson(currentAccount, true)}
          </section>
        )}
        <label className="field-label" htmlFor="people-search">
          {currentAccount ? "Choose another person" : "Find someone"}
        </label>
        <input
          id="people-search"
          aria-label="Search people"
          aria-controls="people-results"
          className="people-search"
          placeholder="Find a person by name or @handle…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div id="people-results" className="people-results" aria-busy={busy}>
          {addError &&
            !newAccounts.some((a) => a.username === failedPerson) && (
              <p role="alert" className="archive-upload-error">
                {addError}
              </p>
            )}
          {savedMatches.length > 0 && (
            <section aria-label="Others you’ve chosen">
              <h3>Others you’ve chosen</h3>
              {savedMatches.map((a) => savedPerson(a))}
            </section>
          )}
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
                          aria-label={`Choose @${a.username}`}
                          onClick={() =>
                            void choosePerson(
                              a.accountId,
                              a.username,
                              a.numTweets,
                            )
                          }
                        >
                          <Avatar
                            src={a.profile?.avatarMediaUrl}
                            size="2"
                            radius="full"
                            fallback={a.username.slice(0, 1).toUpperCase()}
                          />
                          <span className="person-row-text">
                            <strong className="person-username">
                              @{a.username}
                            </strong>
                            <small>
                              {a.numTweets == null
                                ? "Post count unavailable"
                                : `${a.numTweets.toLocaleString()} posts`}
                            </small>
                          </span>
                          <ChevronRightIcon aria-hidden="true" />
                        </button>
                        {addingPerson === a.username && (
                          <p className="person-loading" role="status">
                            <Spinner />
                            <span>
                              Adding{" "}
                              <span className="person-username">
                                @{a.username}
                              </span>
                              …
                            </span>
                          </p>
                        )}
                        {addError && failedPerson === a.username && (
                          <p
                            role="alert"
                            className="person-error archive-upload-error"
                          >
                            {addError}
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
                  : "More people"}
            </button>
          )}
          {addingPerson &&
            !newAccounts.some((a) => a.username === addingPerson) && (
              <p className="person-loading" role="status">
                <Spinner />
                <span>
                  Adding{" "}
                  <span className="person-username">@{addingPerson}</span>…
                </span>
              </p>
            )}
        </div>
      </div>
    </PageContent>
  );
}
