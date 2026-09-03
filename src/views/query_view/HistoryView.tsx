import { Link } from "react-router";
import { useStore } from "../../state/store";
import { PageContent } from "../../components/PageContent";
import { extractTimestampFromUUIDv7 } from "../../utils";

export function HistoryView() {
  const { queryResults } = useStore();
  const questions = [...(queryResults ?? [])].reverse();
  return (
    <PageContent>
      <div className="page-intro">
        <p className="eyebrow">You were curious</p>
        <h1>Past questions.</h1>
        <p className="intro-copy">Some things you’ve asked about people.</p>
      </div>
      {questions.length ? (
        <ul className="history-list">
          {questions.map((query) => (
            <li key={query.id}>
              <Link to={`/query/${query.id}`}>
                <span>
                  {query.query}
                  <small>
                    {query.queriedHandle}
                    {query.queriedHandle && " · "}
                    {new Date(
                      extractTimestampFromUUIDv7(query.id),
                    ).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </small>
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <p>No questions yet.</p>
          <Link to="/">Ask your first question ↗</Link>
        </div>
      )}
      <p className="quiet-note">
        Saved in this browser. Open an answer to see its source tweets, copy it,
        or delete it.
      </p>
    </PageContent>
  );
}
