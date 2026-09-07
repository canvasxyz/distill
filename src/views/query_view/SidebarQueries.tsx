import { NavLink } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useStore } from "../../state/store";
import { db } from "../../db";
import { extractTimestampFromUUIDv7 } from "../../utils";

// The three most recent questions and avatars, newest first.
export function PastQueries({ onNavigate }: { onNavigate?: () => void }) {
  const { queryResults } = useStore();
  const avatars = useLiveQuery(() => db.avatars.toArray(), [], []);
  const recent = [
    ...(queryResults ?? []).map((query) => ({
      key: `question-${query.id}`,
      at: extractTimestampFromUUIDv7(query.id).getTime(),
      to: `/query/${query.id}`,
      title: query.query,
      detail: query.queriedHandle,
      image: null as string | null,
    })),
    ...avatars.map((avatar) => ({
      key: `avatar-${avatar.id}`,
      at: new Date(avatar.createdAt).getTime(),
      to: `/avatar/${encodeURIComponent(avatar.id)}`,
      title: `Avatar for @${avatar.username}`,
      detail: new Date(avatar.createdAt).toLocaleDateString(undefined, {
        dateStyle: "medium",
      }),
      image: avatar.imageDataUrl as string | null,
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 3);
  return recent.length ? (
    <ul className="recent-questions">
      {recent.map((entry) => (
        <li key={entry.key}>
          <NavLink to={entry.to} onClick={onNavigate}>
            {entry.image && <img src={entry.image} alt="" />}
            <span>
              <span>{entry.title}</span>
              {entry.detail && <small>{entry.detail}</small>}
            </span>
          </NavLink>
        </li>
      ))}
    </ul>
  ) : (
    <p className="sidebar-empty">Nothing yet. What are you curious about?</p>
  );
}
