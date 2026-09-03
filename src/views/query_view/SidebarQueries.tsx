import { NavLink } from "react-router";
import { useStore } from "../../state/store";

export function PastQueries({ onNavigate }: { onNavigate?: () => void }) {
  const { queryResults } = useStore();
  const recent = [...(queryResults ?? [])].reverse().slice(0, 4);
  return recent.length ? (
    <ul className="recent-questions">
      {recent.map((query) => (
        <li key={query.id}>
          <NavLink to={`/query/${query.id}`} onClick={onNavigate}>
            <span>{query.query}</span>
            {query.queriedHandle && <small>{query.queriedHandle}</small>}
          </NavLink>
        </li>
      ))}
    </ul>
  ) : (
    <p className="sidebar-empty">Nothing yet. What are you curious about?</p>
  );
}
