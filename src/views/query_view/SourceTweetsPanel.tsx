import { useMemo, useState } from "react";
import { useStore } from "../../state/store";
import type { QueryResult } from "./ai_utils";
import { getAnswerPosts } from "./answer_sources";

export function SourceTweetsPanel({
  result,
  id,
}: {
  result: QueryResult;
  id: string;
}) {
  const { accounts } = useStore();
  const { posts, unavailable } = useMemo(
    () => getAnswerPosts(result),
    [result],
  );
  const [shown, setShown] = useState(20);
  return (
    <section
      id={id}
      className="source-posts"
      aria-label="The tweets behind this"
    >
      <h3>The tweets behind this</h3>
      <p className="quiet-note">
        These {posts.length.toLocaleString()} posts were sent with the question.
        They’re context, not proof that the answer got the person right.
      </p>
      {!posts.length && <p>No source posts were saved with this answer.</p>}
      <ol>
        {posts.slice(0, shown).map((tweet) => {
          const username = accounts.find(
            (a) => a.accountId === tweet.account_id,
          )?.username;
          const date = new Date(tweet.created_at);
          return (
            <li key={tweet.id_str || tweet.id}>
              <div className="source-post-meta">
                <span>
                  {username
                    ? `@${username}`
                    : result.queriedHandle || "Archived post"}
                </span>
                <time>
                  {Number.isNaN(date.getTime())
                    ? tweet.created_at
                    : date.toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                </time>
                <a
                  href={`https://x.com/i/status/${tweet.id_str || tweet.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open post ${tweet.id_str || tweet.id} on X`}
                >
                  ↗
                </a>
              </div>
              <p>{tweet.full_text}</p>
            </li>
          );
        })}
      </ol>
      {shown < posts.length && (
        <button className="plain-button" onClick={() => setShown(shown + 20)}>
          Show 20 more · {posts.length - shown} remaining ↓
        </button>
      )}
      {unavailable.length > 0 && (
        <p className="quiet-note">
          Citations not found in the saved posts: {unavailable.join(", ")}.
        </p>
      )}
    </section>
  );
}
