import type { Tweet } from "./types";

export function TweetEntry({
  tweet,
  onCheckboxChange,
  checked,
  isIncluded,
}: {
  tweet: Tweet;
  onCheckboxChange: (isChecked: boolean) => void;
  checked: boolean;
  isIncluded: boolean;
}) {
  const color = isIncluded ? "green" : "red";

  return (
    <div
      style={{
        border: `1px solid ${color}`,
        borderRadius: "5px",
        padding: "10px",
        marginBottom: "10px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckboxChange(event.target.checked)}
        />
        <span style={{ color: color }}>
          {isIncluded ? "included" : "excluded"}
        </span>
      </div>
      <p style={{ margin: "10px 0" }}>&quot;{tweet.text}&quot;</p>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{new Date(tweet.created).toLocaleString()}</span>
        {tweet.label && <span>{tweet.label}</span>}
      </div>
    </div>
  );
}
