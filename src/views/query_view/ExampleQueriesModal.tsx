import { useEffect } from "react";
import { replaceAccountName } from "./ai_utils";
import { useStore } from "../../state/store";

export function ExampleQueriesModal({
  isOpen,
  onClose,
  queries,
  onSelectQuery,
}: {
  isOpen: boolean;
  onClose: () => void;
  queries: string[];
  onSelectQuery?: (query: string) => void;
}) {
  const { account } = useStore();
  // Prevent scroll on the underlying page when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

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
            marginBottom: 18,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22, flex: 1 }}>
            Example Questions
          </h2>
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
            {queries.map((query, idx) => {
              const queryWithAccountName = replaceAccountName(
                query,
                account?.username || ""
              );
              return (
                <li
                  key={idx}
                  style={{
                    padding: "10px 0",
                    borderBottom:
                      idx !== queries.length - 1 ? "1px solid #eee" : undefined,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{ marginRight: 10, flex: "1 1 auto", fontSize: 15 }}
                  >
                    {queryWithAccountName}
                  </span>
                  {onSelectQuery && (
                    <button
                      style={{
                        padding: "6px 14px",
                        fontSize: 14,
                        borderRadius: 4,
                        border: "1px solid #007bff",
                        background: "#007bff",
                        color: "white",
                        cursor: "pointer",
                        minWidth: 90,
                        boxSizing: "border-box",
                      }}
                      onClick={() => onSelectQuery(queryWithAccountName)}
                    >
                      Use this
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
