import { filters } from "./filtering/filters";
import { LinkButton } from "./LinkButton";
import { useStore } from "./state/store";

function HorizontalRule() {
  return (
    <hr
      style={{
        margin: "0 0",
        border: "none",
        borderTop: "1px solid #ccc",
      }}
    />
  );
}

export function Sidebar() {
  const {
    analyzeTweets,
    numTweetsAnalyzed,
    analysisInProgress,
    appIsReady,
    dbHasTweets,
    clearDatabase,
    allTweets,
    includedTweets,
    excludedTweets,
    tweetsByFilterName,
  } = useStore();

  const totalNumTweets = (allTweets || []).length;
  return (
    <div
      style={{
        width: "250px",
        borderRight: "1px solid #ccc",
        paddingLeft: "10px",
        paddingRight: "10px",
      }}
    >
      <h1 style={{ fontSize: "22px" }}>Tweet Archive Explorer</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <LinkButton to="/" disabled={!allTweets}>
          All tweets {allTweets && `(${allTweets.length})`}
        </LinkButton>
        <LinkButton to="/included-tweets" disabled={!allTweets}>
          Included 👍 {includedTweets && `(${includedTweets.length})`}
        </LinkButton>
        <LinkButton to="/excluded-tweets" disabled={!allTweets}>
          Excluded 👎 {excludedTweets && `(${excludedTweets.length})`}
        </LinkButton>
        <HorizontalRule />
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
        {/* <HorizontalRule/>

        <button
          style={{
            borderRadius: "5px",
            padding: "5px",
            transition: "background-color 0.1s",
            textDecoration: "none",
            color: "black",
            border: "1px solid blue",
            backgroundColor: "white",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#f0f0f0")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "white")
          }
        >
          Download Included Tweets
        </button> */}

        {analysisInProgress ? (
          <>
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
          </>
        ) : (
          <button
            style={
              allTweets
                ? {
                    borderRadius: "5px",
                    padding: "5px",
                    transition: "background-color 0.1s",
                    textDecoration: "none",
                    color: "black",
                    border: "1px solid blue",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }
                : {
                    borderRadius: "5px",
                    padding: "5px",
                    textDecoration: "none",
                    color: "black",
                    border: "1px solid blue",
                    backgroundColor: "#ebebeb",
                  }
            }
            onMouseEnter={(e) => {
              if (allTweets) e.currentTarget.style.backgroundColor = "#f0f0f0";
            }}
            onMouseLeave={(e) => {
              if (allTweets) e.currentTarget.style.backgroundColor = "white";
            }}
            onClick={() => {
              analyzeTweets();
            }}
            disabled={!allTweets}
          >
            Analyze Tweets ⚡
          </button>
        )}
        <HorizontalRule />

        <LinkButton to="/model-query" disabled={!allTweets}>
          Model Query ✨
        </LinkButton>

        <HorizontalRule />

        <button
          style={
            appIsReady && dbHasTweets
              ? {
                  borderRadius: "5px",
                  padding: "5px",
                  textDecoration: "none",
                  color: "white",
                  border: "1px solid #d32f2f",
                  backgroundColor: "#d32f2f",
                  cursor: "pointer",
                }
              : {
                  borderRadius: "5px",
                  padding: "5px",
                  textDecoration: "none",
                  color: "white",
                  border: "1px solid #d32f2f",
                  backgroundColor: "#f8d7da",
                }
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              appIsReady && dbHasTweets ? "#b71c1c" : "#fff5f6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              appIsReady && dbHasTweets ? "#d32f2f" : "#f8d7da";
          }}
          onClick={() => {
            // if (appIsReady && dbHasTweets)
            clearDatabase();
          }}
          // disabled={!allTweets}
        >
          Clear database
        </button>
        {/* <button
          style={{
            borderRadius: "5px",
            padding: "5px",
            transition: "background-color 0.1s",
            textDecoration: "none",
            color: "black",
            border: "1px solid blue",
            backgroundColor: "white",
            cursor: "pointer",
            marginTop: "10px",
            marginBottom: "10px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#f0f0f0")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "white")
          }
          onClick={() => {
            printLabels();
          }}
        >
          Print labels
        </button> */}

        <span style={{ fontSize: "0.75em", fontStyle: "italic" }}>
          Note: Tweet Archive Explorer analyzes the text content of tweets, not
          the images or any other linked data (e.g. quoted tweets).
        </span>
      </div>
    </div>
  );
}
