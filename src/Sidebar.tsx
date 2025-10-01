import { filters } from "./filters";
import { LinkButton } from "./LinkButton";
import { useStore } from "./store";

export function Sidebar() {
  const {
    tweets,
    excludedTweets,
    includedTweets,
    tweetsByLabel,
    analyzeTweets,
  } = useStore();

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
        <LinkButton to="/" disabled={!tweets}>
          All tweets {tweets && `(${tweets.length})`}
        </LinkButton>
        <LinkButton to="/included-tweets" disabled={!tweets}>
          Included 👍 {includedTweets && `(${includedTweets.length})`}
        </LinkButton>
        <LinkButton to="/excluded-tweets" disabled={!tweets}>
          Excluded 👎 {excludedTweets && `(${excludedTweets.length})`}
        </LinkButton>
        <hr
          style={{
            margin: "20px 0",
            border: "none",
            borderTop: "1px solid #ccc",
          }}
        />
        {filters.map((filter, index) => (
          <LinkButton
            key={index}
            to={`/filters/${filter.name}`}
            disabled={!tweets}
          >
            {filter.label}{" "}
            {tweetsByLabel[filter.name] &&
              `(${tweetsByLabel[filter.name].length})`}
          </LinkButton>
        ))}
        {/* <hr
          style={{
            margin: "20px 0",
            border: "none",
            borderTop: "1px solid #ccc",
          }}
        />

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

        <button
          style={
            tweets
              ? {
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
                }
              : {
                  borderRadius: "5px",
                  padding: "5px",
                  textDecoration: "none",
                  color: "black",
                  border: "1px solid blue",
                  backgroundColor: "#ebebeb",
                  marginTop: "10px",
                  marginBottom: "10px",
                }
          }
          onMouseEnter={(e) => {
            if (tweets) e.currentTarget.style.backgroundColor = "#f0f0f0";
          }}
          onMouseLeave={(e) => {
            if (tweets) e.currentTarget.style.backgroundColor = "white";
          }}
          onClick={() => {
            analyzeTweets();
          }}
          disabled={!tweets}
        >
          Analyze Tweets ⚡
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
      </div>
    </div>
  );
}
