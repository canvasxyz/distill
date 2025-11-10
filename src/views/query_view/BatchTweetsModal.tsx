import { useEffect, useMemo, useState } from "react";
import { type QueryResult } from "./ai_utils";
import { useStore } from "../../state/store";

function formatDate(dateString: string) {
  if (!dateString) return "";
  // Try to parse dates like "Fri Sep 10 22:00:07 +0000 2021"
  const parsed = new Date(dateString);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return dateString;
}

export function BatchTweetsModal({
  queryResult,
  isOpen,
  onClose,
}: {
  queryResult: QueryResult | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { accounts } = useStore();

  const accountIdToUsername = useMemo(
    () =>
      new Map<string, string>(
        (accounts || []).map((a) => [a.accountId, a.username]),
      ),
    [accounts],
  );

  // Prevent scroll on the underlying page when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const batchesByKey = useMemo(() => {
    if (!queryResult) return [];
    return Object.entries(queryResult.batchStatuses)
      .filter(([, batchStatus]) => batchStatus.status === "done")
      .map(([batchId, batchStatus]) => ({
        batchId,
        batchStatus: batchStatus as Extract<
          typeof batchStatus,
          { status: "done" }
        >,
      }))
      .sort((a, b) => parseInt(a.batchId) - parseInt(b.batchId));
  }, [queryResult]);

  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(
    new Set(),
  );

  const toggleBatch = (batchId: string) => {
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) {
        next.delete(batchId);
      } else {
        next.add(batchId);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 1000,
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 768,
          maxHeight: "80vh",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
          padding: "32px 24px 24px 24px",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22, flex: 1 }}>Evidence</h2>

          <button
            style={{
              border: "none",
              background: "transparent",
              fontSize: "22px",
              cursor: "pointer",
              color: "#666",
              fontWeight: "bold",
              marginLeft: 12,
              alignSelf: "flex-start",
            }}
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <p>
          To generate the query result, Twitter Archive Explorer first extracts
          the most relevant tweets from the user's archive using a large
          language model. The retrieved tweets are then checked against the
          archive itself for "hallucinations". Only tweets that are actually
          present in the archive are used to generate the final result.
        </p>
        <p>
          Model: {queryResult?.model} on {queryResult?.provider}
        </p>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            maxHeight: "54vh",
            overflowY: "auto",
            marginTop: "16px",
          }}
        >
          {batchesByKey.map(({ batchId, batchStatus }, batchIdx) => {
            const tweets = batchStatus.groundedTweets.genuine;
            const hallucinatedIds = batchStatus.groundedTweets.hallucinated;
            const isExpanded = expandedBatches.has(batchId);
            const hasContent = tweets.length > 0 || hallucinatedIds.length > 0;

            if (!hasContent) return null;

            return (
              <div
                key={batchId}
                style={{
                  marginBottom: batchIdx < batchesByKey.length - 1 ? "16px" : 0,
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => toggleBatch(batchId)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "#f8f9fa",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      Batch {parseInt(batchId) + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 400,
                        color: "#666",
                        marginLeft: "12px",
                      }}
                    >
                      {tweets.length} evidence
                      {hallucinatedIds.length > 0 &&
                        `, ${hallucinatedIds.length} hallucinations`}
                      {" · "}
                      {Math.round(batchStatus.runTime)}ms {batchStatus.provider}{" "}
                      {batchStatus.model}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 18,
                      color: "#666",
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  >
                    ▶
                  </span>
                </button>
                {isExpanded && (
                  <div style={{ padding: "16px", background: "#fff" }}>
                    {tweets.length > 0 && (
                      <div
                        style={{
                          marginBottom: hallucinatedIds.length > 0 ? "20px" : 0,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            margin: "0 0 12px 0",
                            color: "#333",
                          }}
                        >
                          Evidence ({tweets.length})
                        </h4>
                        <ul
                          style={{
                            padding: 0,
                            margin: 0,
                            listStyle: "none",
                          }}
                        >
                          {tweets.map((tweet, idx) => {
                            // Try to show the username, falling back to account_id if available
                            return (
                              <li
                                key={tweet.id_str}
                                style={{
                                  padding: "10px 0",
                                  borderBottom:
                                    idx !== tweets.length - 1
                                      ? "1px solid #eee"
                                      : undefined,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span
                                  style={{
                                    marginRight: 10,
                                    flex: "1 1 auto",
                                    fontSize: 15,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 3,
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "#1976d2",
                                        fontWeight: 500,
                                        marginRight: 8,
                                        fontSize: 13,
                                      }}
                                    >
                                      @
                                      {accountIdToUsername.get(
                                        tweet.account_id,
                                      )}
                                    </span>
                                    <span
                                      style={{
                                        color: "#888",
                                        fontSize: 12,
                                        marginRight: 16,
                                      }}
                                      title={tweet.created_at}
                                    >
                                      {formatDate(tweet.created_at)}
                                    </span>
                                    <span
                                      style={{
                                        color: "#757575",
                                        fontSize: 12,
                                        marginRight: 10,
                                        display: "inline-flex",
                                        alignItems: "center",
                                      }}
                                      title={`${tweet.favorite_count ?? 0} Likes`}
                                    >
                                      <span style={{ marginRight: 2 }}>♥</span>
                                      {tweet.favorite_count ?? 0}
                                    </span>
                                    <span
                                      style={{
                                        color: "#757575",
                                        fontSize: 12,
                                        display: "inline-flex",
                                        alignItems: "center",
                                      }}
                                      title={`${tweet.retweet_count ?? 0} Retweets`}
                                    >
                                      <span style={{ marginRight: 2 }}>🔁</span>
                                      {tweet.retweet_count ?? 0}
                                    </span>
                                  </span>
                                  <span>{tweet.full_text}</span>
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {hallucinatedIds.length > 0 && (
                      <div>
                        <h4
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            margin: "0 0 12px 0",
                            color: "#d32f2f",
                          }}
                        >
                          Hallucinations ({hallucinatedIds.length})
                        </h4>
                        <ul
                          style={{
                            padding: 0,
                            margin: 0,
                            listStyle: "none",
                          }}
                        >
                          {hallucinatedIds.map((tweetId, idx) => {
                            return (
                              <li
                                key={tweetId}
                                style={{
                                  padding: "10px 0",
                                  borderBottom:
                                    idx !== hallucinatedIds.length - 1
                                      ? "1px solid #eee"
                                      : undefined,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span
                                  style={{
                                    marginRight: 10,
                                    flex: "1 1 auto",
                                    fontSize: 15,
                                    fontFamily: "monospace",
                                    color: "#666",
                                  }}
                                >
                                  {tweetId}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
