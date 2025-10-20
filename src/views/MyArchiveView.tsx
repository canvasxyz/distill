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
              marginBottom: "32px",
              background: "linear-gradient(90deg, #f8fafc 60%, #f0f4ff 100%)",
              padding: "32px",
              borderRadius: "20px",
              boxShadow: "0 3px 16px 2px rgba(30,60,160,0.07)",
              display: "flex",
              alignItems: "center",
              gap: "28px",
            }}
          >
            {/* Avatar and initials for cohesiveness */}
            <div
              style={{
                minWidth: 80,
                minHeight: 80,
                background: "linear-gradient(135deg,#ced9fd 70%,#e2edfa 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.2rem",
                fontWeight: 700,
                color: "#5078B3",
                letterSpacing: "1px",
                boxShadow: "0 2px 6px rgba(80,120,180,0.10)",
                border: "2px solid #afcfef",
                flexShrink: 0,
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
            {/* Details column */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "7px",
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: "1.2em",
                  fontWeight: 800,
                  color: "#223259",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span>{account.accountDisplayName}</span>
                <span style={{ color: "#5b92ee", fontWeight: 600 }}>
                  @{account.username}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  flexWrap: "wrap",
                  color: "#607399",
                  fontSize: "1em",
                }}
              >
                <span style={{ display: "flex", alignItems: "center" }}>
                  <span
                    role="img"
                    aria-label="Email"
                    style={{
                      marginBottom: "-2px",
                      marginRight: "5px",
                      fontSize: "1em",
                    }}
                  >
                    📧
                  </span>
                  {account.email}
                </span>
                <span style={{ display: "flex", alignItems: "center" }}>
                  <span
                    role="img"
                    aria-label="Calendar"
                    style={{
                      marginBottom: "-2px",
                      marginRight: "5px",
                      fontSize: "1em",
                    }}
                  >
                    📅
                  </span>
                  <span>
                    Joined:{" "}
                    <span style={{ color: "#8b92b7", fontWeight: 600 }}>
                      {account.createdAt}
                    </span>
                  </span>
                </span>
              </div>
              {/* Profile extra info */}
              {profile?.description && (
                <div
                  style={{
                    marginTop: "10px",
                    color: "#4b5563",
                    fontSize: "1.07em",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    maxWidth: 500,
                  }}
                >
                  {profile.description.bio && (
                    <div style={{ marginBottom: "3px", fontWeight: 500 }}>
                      {profile.description.bio}
                    </div>
                  )}
                  {(profile.description.location ||
                    profile.description.website) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "18px",
                        flexWrap: "wrap",
                        color: "#6273a4",
                        fontWeight: 500,
                        marginTop: "2px",
                      }}
                    >
                      {profile.description.location && (
                        <span style={{ display: "flex", alignItems: "center" }}>
                          <span
                            role="img"
                            aria-label="Location"
                            style={{
                              marginBottom: "-2px",
                              marginRight: "5px",
                              fontSize: "1em",
                            }}
                          >
                            📍
                          </span>
                          {profile.description.location}
                        </span>
                      )}
                      {profile.description.website && (
                        <span style={{ display: "flex", alignItems: "center" }}>
                          <span
                            role="img"
                            aria-label="Website"
                            style={{
                              marginBottom: "-2px",
                              marginRight: "5px",
                              fontSize: "1em",
                            }}
                          >
                            🌐
                          </span>
                          <a
                            href={profile.description.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#547ee2",
                              textDecoration: "underline",
                              wordBreak: "break-all",
                            }}
                          >
                            {profile.description.website.replace(
                              /^https?:\/\//,
                              ""
                            )}
                          </a>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
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
