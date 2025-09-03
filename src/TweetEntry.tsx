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
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <input type="checkbox" />
        <span style={{ color: textColor }}>{tweet.status}</span>
      </div>
      <p style={{ margin: "10px 0" }}>&quot;{tweet.text}&quot;</p>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{new Date(tweet.created).toLocaleString()}</span>
        {tweet.label && <span>{tweet.label}</span>}
      </div>
    </div>
  );
}
