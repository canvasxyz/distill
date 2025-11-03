import { useEffect, useMemo, useState } from "react";
import { type QueryResult } from "./ai_utils";

export function BatchTweetsModal({
  queryResult,
  isOpen,
  onClose,
}: {
  queryResult: QueryResult | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  // Prevent scroll on the underlying page when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const batchTweets = useMemo(() => {
    if (!queryResult) return [];
    return Object.values(queryResult?.batchStatuses)
      .filter((batchStatus) => batchStatus.status === "done")
      .map((batchStatus) => batchStatus.groundedTweets.genuine)
      .flat();
  }, [queryResult]);

  const batchHallucinations = useMemo(() => {
    if (!queryResult) return [];
    return Object.values(queryResult?.batchStatuses)
      .filter((batchStatus) => batchStatus.status === "done")
      .map((batchStatus) => batchStatus.groundedTweets.hallucinated)
      .flat()
      .map((tweetId) => ({ id_str: tweetId }));
  }, [queryResult]);

  const TABS = [
    { label: "Evidence", key: "evidence", count: batchTweets.length },
    {
      label: "Possible Hallucinations",
      key: "hallucinations",
      count: batchHallucinations.length,
    },
  ];
  const [activeTab, setActiveTab] = useState(TABS[0].key);

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
            display: "flex",
            marginTop: "16px",
            gap: "8px",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key ? "#f5f5f5" : "transparent",
                border: "none",
                borderBottom:
                  activeTab === tab.key
                    ? "3px solid #007bff"
                    : "3px solid transparent",
                color: activeTab === tab.key ? "#007bff" : "#333",
                fontWeight: activeTab === tab.key ? "bold" : "normal",
                padding: "12px 20px",
                cursor: "pointer",
                outline: "none",
                fontSize: "16px",
                transition: "color 0.2s, border-bottom 0.2s, background 0.2s",
                borderRadius: "6px 6px 0 0",
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        {activeTab === "evidence" ? (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              maxHeight: "54vh", // Ensures scrolling space for the list
              overflowY: "auto",
            }}
          >
            <ul
              style={{
                padding: 0,
                margin: 0,
                listStyle: "none",
              }}
            >
              {batchTweets.map((batchTweet, idx) => {
                return (
                  <li
                    key={idx}
                    style={{
                      padding: "10px 0",
                      borderBottom:
                        idx !== batchTweets.length - 1
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
                      }}
                    >
                      {batchTweet.full_text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                maxHeight: "54vh", // Ensures scrolling space for the list
                overflowY: "auto",
              }}
            >
              <ul
                style={{
                  padding: 0,
                  margin: 0,
                  listStyle: "none",
                }}
              >
                {batchHallucinations.map((batchTweet, idx) => {
                  return (
                    <li
                      key={idx}
                      style={{
                        padding: "10px 0",
                        borderBottom:
                          idx !== batchTweets.length - 1
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
                        }}
                      >
                        {batchTweet.id_str}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
