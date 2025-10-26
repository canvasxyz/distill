import { AnalyzeTweetsButton } from "./AnalyzeTweetsButton";
import { filters } from "../filtering/filters";
import { LinkButton } from "./LinkButton";
import { useStore } from "../state/store";
import { useMatch } from "react-router";

function HorizontalRule() {
  return (
    <hr
      style={{
        margin: "0 0",
        border: "none",
        borderTop: "1px solid #ddd",
      }}
    />
  );
}

export function Sidebar() {
  const onQueryPage = useMatch("/");
  const {
    analyzeTweets,
    numTweetsAnalyzed,
    analysisInProgress,
    allTweets,
    viewingMyArchive,
    includedTweets,
    excludedTweets,
    tweetsByFilterName,
    downloadArchive,
  } = useStore();

  const totalNumTweets = (allTweets || []).length;
  return (
    <div
      style={{
        width: "210px",
        borderRight: "1px solid #ddd",
        padding: "10px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <LinkButton to="/" size="lg">
          Archive Explorer
        </LinkButton>
        <LinkButton to="/all-tweets" disabled={!viewingMyArchive} size="lg">
          Archive Review
        </LinkButton>

        {!onQueryPage && (
          <>
            <LinkButton to="/included-tweets" disabled={!allTweets}>
              Included 👍 {includedTweets && `(${includedTweets.length})`}
            </LinkButton>
            <LinkButton to="/excluded-tweets" disabled={!allTweets}>
              Excluded 👎 {excludedTweets && `(${excludedTweets.length})`}
            </LinkButton>
            {filters.map((filter, index) => (
              <LinkButton
                key={index}
                to={`/filters/${filter.name}`}
                disabled={!allTweets}
              >
                {filter.label}{" "}
                {tweetsByFilterName[filter.name] &&
                  `(${tweetsByFilterName[filter.name].length})`}
              </LinkButton>
            ))}
            {analysisInProgress ? (
              <div style={{ width: "100%", margin: "10px 0" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: "16px",
                      background: "#eee",
                      borderRadius: "8px",
                      overflow: "hidden",
                      position: "relative",
                      minWidth: "60px",
                    }}
                  >
                    <div
                      style={{
                        width: `${totalNumTweets ? (numTweetsAnalyzed / totalNumTweets) * 100 : 0}%`,
                        height: "100%",
                        background: "#4caf50",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "13px", minWidth: "90px" }}>
                    {numTweetsAnalyzed}/{totalNumTweets} analyzed
                  </span>
                </div>
              </div>
            ) : (
              <AnalyzeTweetsButton
                canAnalyse={!!allTweets}
                onClick={() => analyzeTweets()}
              />
            )}
            <button
              style={{
                borderRadius: "5px",
                padding: "8px 16px",
                margin: "4px 0 12px",
                backgroundColor: "#eee",
                border: "1px solid #ccc",
                fontSize: "16px",
                cursor: allTweets ? "pointer" : "not-allowed",
                width: "100%",
                textAlign: "center",
                opacity: allTweets ? 1 : 0.6,
              }}
              title="Download"
              onClick={() => {
                if (!allTweets) return;
                downloadArchive();
              }}
              disabled={!allTweets}
            >
              Download Tweets
            </button>

            <HorizontalRule />
            <span style={{ fontSize: "0.75em", fontStyle: "italic" }}>
              Note: Twitter Archive Explorer analyzes the text content of
              tweets, not the images or any other linked data (e.g. quoted
              tweets).
            </span>
          </>
        )}
      </div>
      {/* Floating Feedback button at the bottom-left of the sidebar */}
      <a
        href="https://docs.google.com/forms/d/e/1FAIpQLSdyfyXW0Kev9USSqr97FuIoZgXCqVebJsE7aj3kBWEw_xahRQ/viewform?usp=dialog"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          left: "10px",
          bottom: "60px",
          display: "inline-block",
          background: "#f7fafc",
          borderRadius: "4px",
          padding: "10px 18px",
          textDecoration: "none",
          cursor: "pointer",
          color: "#345388",
          fontWeight: 600,
          fontSize: "1em",
          boxShadow: "0 1.5px 6px 0px rgba(120, 150, 200, 0.08)",
          outline: "none",
          border: "1px solid #e2e6ef",
          zIndex: 1000,
        }}
        title="Send feedback or get info"
      >
        Send Feedback
      </a>
      <a
        href="https://docs.google.com/forms/d/e/1FAIpQLSdyfyXW0Kev9USSqr97FuIoZgXCqVebJsE7aj3kBWEw_xahRQ/viewform?usp=dialog"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          left: "10px",
          bottom: "12px",
          display: "inline-block",
          background: "#f7fafc",
          borderRadius: "4px",
          padding: "10px 18px",
          textDecoration: "none",
          cursor: "pointer",
          color: "#345388",
          fontWeight: 600,
          fontSize: "1em",
          boxShadow: "0 1.5px 6px 0px rgba(120, 150, 200, 0.08)",
          outline: "none",
          border: "1px solid #e2e6ef",
          zIndex: 1000,
        }}
        title="Send feedback or get info"
      >
        Subscribe to Updates
      </a>
    </div>
  );
}
