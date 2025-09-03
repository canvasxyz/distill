import type { Tweet } from "./types";

const getColorByStatus = (status: string) => {
  switch (status) {
    case "excluded":
      return { borderColor: "red", textColor: "red" };
    case "included":
      return { borderColor: "green", textColor: "green" };
    default:
      return { borderColor: "gray", textColor: "black" };
  }
};

export function TweetEntry({ tweet }: { tweet: Tweet }) {
  const { borderColor, textColor } = getColorByStatus(tweet.status);
  return (
    <div
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: "5px",
        padding: "10px",
        marginBottom: "10px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "auto auto auto",
        gap: "10px",
      }}
    >
      <input type="checkbox" style={{ gridColumn: "1", gridRow: "1" }} />
      <span style={{ gridColumn: "3", gridRow: "1", color: textColor }}>
        {tweet.status}
      </span>
      <p style={{ gridColumn: "2", gridRow: "2", margin: 0 }}>
        &quot;{tweet.text}&quot;
      </p>
      <span style={{ gridColumn: "1", gridRow: "3" }}>
        {new Date(tweet.created).toLocaleString()}
      </span>
      {tweet.label && (
        <span style={{ gridColumn: "3", gridRow: "3" }}>{tweet.label}</span>
      )}
    </div>
  );
}
