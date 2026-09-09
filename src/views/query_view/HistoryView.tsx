import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRightIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { useStore } from "../../state/store";
import { db } from "../../db";
import { PageContent } from "../../components/PageContent";
import { extractTimestampFromUUIDv7 } from "../../utils";
import type { GeneratedAvatar } from "../../state/avatar";
import type { QueryResult } from "./ai_utils";

type HistoryEntry =
  | { kind: "question"; at: Date; query: QueryResult }
  | { kind: "avatar"; at: Date; avatar: GeneratedAvatar };

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, { dateStyle: "medium" });

export function HistoryView() {
  const { queryResults } = useStore();
  const avatars = useLiveQuery(() => db.avatars.toArray(), [], []);
  // Questions and avatars share one timeline, newest first.
  const entries: HistoryEntry[] = [
    ...(queryResults ?? []).map((query) => ({
      kind: "question" as const,
      at: extractTimestampFromUUIDv7(query.id),
      query,
    })),
    ...avatars.map((avatar) => ({
      kind: "avatar" as const,
      at: new Date(avatar.createdAt),
      avatar,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
  return (
    <PageContent>
      <div className="page-intro">
        <p className="eyebrow">You were curious</p>
        <h1>Past questions.</h1>
        <p className="intro-copy">
          Things you’ve asked about people, and the avatars you’ve made.
        </p>
      </div>
      {entries.length ? (
        <ul className="history-list">
          {entries.map((entry) =>
            entry.kind === "question" ? (
              <li key={`question-${entry.query.id}`}>
                <Link to={`/query/${entry.query.id}`}>
                  <span>
                    {entry.query.query}
                    <small>
                      {entry.query.queriedHandle}
                      {entry.query.queriedHandle && " · "}
                      {formatDate(entry.at)}
                    </small>
                  </span>
                  <ChevronRightIcon aria-hidden="true" />
                </Link>
              </li>
            ) : (
              <li key={`avatar-${entry.avatar.id}`}>
                <Link
                  to={`/avatar/${encodeURIComponent(entry.avatar.id)}`}
                  className="history-avatar"
                >
                  <img
                    src={entry.avatar.imageDataUrl}
                    alt={`Generated avatar for @${entry.avatar.username}`}
                  />
                  <span>
                    Avatar for @{entry.avatar.username}
                    <small>
                      {entry.avatar.imageModel} · {formatDate(entry.at)}
                    </small>
                  </span>
                  <ChevronRightIcon aria-hidden="true" />
                </Link>
              </li>
            ),
          )}
        </ul>
      ) : (
        <div className="empty-state">
          <p>No questions yet.</p>
          <Link to="/">
            Ask your first question
            <ArrowRightIcon className="inline-icon" aria-hidden="true" />
          </Link>
        </div>
      )}
      <p className="quiet-note">
        Saved in this browser. Open an answer to see its source tweets, copy it,
        or delete it. Open an avatar to download, re-render or delete it.
      </p>
    </PageContent>
  );
}
