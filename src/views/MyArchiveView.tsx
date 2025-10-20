import { useStore } from "../state/store";

export function MyArchiveView() {
  const { allTweets, includedTweets, excludedTweets, clearDatabase } =
    useStore();

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
