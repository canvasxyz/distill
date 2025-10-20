import { useStore } from "../state/store";

export function MyArchiveView() {
  const {
    account,
    allTweets,
    includedTweets,
    excludedTweets,
    clearDatabase,
    profile,
  } = useStore();

  return (
    <div style={{ height: "100vh", overflowY: "scroll" }}>
      <div
        style={{
          maxHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          paddingLeft: "10px",
          paddingRight: "10px",
          margin: "0 auto",
          maxWidth: "1200px",
        }}
      >
        <h1>My Archive</h1>
        {account ? (
          <div
            style={{
              marginBottom: "24px",
              background: "linear-gradient(90deg, #f8fafc 60%, #f0f4ff 100%)",
              padding: "28px 32px",
              borderRadius: "18px",
              boxShadow: "0 3px 16px 2px rgba(30,60,160,0.07)",
              display: "flex",
              alignItems: "center",
              gap: "32px",
            }}
          >
            <div
              style={{
                width: 78,
                height: 78,
                background: "linear-gradient(135deg,#ced9fd 70%,#e2edfa 100%)",
                borderRadius: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                fontWeight: 700,
                color: "#5078B3",
                letterSpacing: "1px",
                boxShadow: "0 2px 6px rgba(80,120,180,0.12)",
                marginRight: "10px",
                border: "2px solid #afcfef",
              }}
              title={account.accountDisplayName}
            >
              {account.accountDisplayName
                ? account.accountDisplayName
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "@"}
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "7px" }}
            >
              <div
                style={{
                  fontSize: "1.25em",
                  fontWeight: 700,
                  color: "#223259",
                }}
              >
                {account.accountDisplayName}
                <span
                  style={{ color: "#5b92ee", marginLeft: 8, fontWeight: 600 }}
                >
                  @{account.username}
                </span>
              </div>
              <div
                style={{
                  color: "#607399",
                  fontSize: "1em",
                  display: "flex",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <span>
                  <svg
                    width="16"
                    height="16"
                    style={{ marginBottom: "-2px", marginRight: "3px" }}
                    fill="#8dbbf7"
                    viewBox="0 0 24 24"
                  >
                    <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h15A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 19.5v-15zm2.75.5a.75.75 0 0 0-.75.75v.283l8 5.29 8-5.29V5.75a.75.75 0 0 0-.75-.75h-14.5zm15.25 2.972-7.552 4.99a.75.75 0 0 1-.84 0L3 7.972V19.5c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75V7.972z" />
                  </svg>
                  {account.email}
                </span>
                <span>
                  <svg
                    width="16"
                    height="16"
                    style={{ marginBottom: "-2px", marginRight: "3px" }}
                    fill="#b48aff"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.104 0-2 .896-2 2v14c0 1.104.896 2 2 2h14c1.104 0 2-.896 2-2V6c0-1.104-.896-2-2-2zM5 20V8h14v12H5z" />
                  </svg>
                  Joined:{" "}
                  <span style={{ color: "#8b92b7", fontWeight: 600 }}>
                    {account.createdAt}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: "16px", color: "#a00" }}>
            No account loaded.
          </div>
        )}

        <div
          style={{
            fontSize: "18px",
            margin: "10px 0",
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <a
            href="#/"
            style={{
              display: "block",
              padding: "20px 30px",
              borderRadius: "16px",
              backgroundColor: "#f0f4f8",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              minWidth: "170px",
              margin: "8px 0",
              textDecoration: "none",
              color: "inherit",
              transition: "background 0.13s, box-shadow 0.13s",
              cursor: "pointer",
            }}
            tabIndex={0}
          >
            <strong>Total tweets:</strong> {allTweets ? allTweets.length : 0}
          </a>
          <a
            href="#/included-tweets"
            style={{
              display: "block",
              padding: "20px 30px",
              borderRadius: "16px",
              backgroundColor: "#e8fbf0",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              minWidth: "170px",
              margin: "8px 0",
              textDecoration: "none",
              color: "inherit",
              transition: "background 0.13s, box-shadow 0.13s",
              cursor: "pointer",
            }}
            tabIndex={0}
          >
            <strong>Included tweets:</strong>{" "}
            {includedTweets ? includedTweets.length : 0}
          </a>
          <a
            href="#/excluded-tweets"
            style={{
              display: "block",
              padding: "20px 30px",
              borderRadius: "16px",
              backgroundColor: "#fbeee8",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              minWidth: "170px",
              margin: "8px 0",
              textDecoration: "none",
              color: "inherit",
              transition: "background 0.13s, box-shadow 0.13s",
              cursor: "pointer",
            }}
            tabIndex={0}
          >
            <strong>Excluded tweets:</strong>{" "}
            {excludedTweets ? excludedTweets.length : 0}
          </a>
        </div>
        <button
          style={{
            borderRadius: "5px",
            padding: "8px 16px",
            margin: "10px 0",
            backgroundColor: "#eee",
            border: "1px solid #ccc",
            fontSize: "16px",
            cursor: "pointer",
            width: "fit-content",
          }}
          disabled
          title="Download not implemented yet"
        >
          Download Tweets (Coming Soon)
        </button>
        <button
          style={{
            borderRadius: "5px",
            padding: "8px 16px",
            margin: "10px 0",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c2c7",
            fontSize: "16px",
            cursor: "pointer",
            color: "#721c24",
            width: "fit-content",
          }}
          onClick={clearDatabase}
        >
          Clear My Data
        </button>
      </div>
    </div>
  );
}
