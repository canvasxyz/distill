import { useStore } from "./store";
import type { Tweet } from "./types";

export function TweetEntry({
  tweet,
  onCheckboxChange,
  checked,
  isIncluded,
  labels,
}: {
  tweet: Tweet;
  onCheckboxChange: (isChecked: boolean) => void;
  checked: boolean;
  isIncluded: boolean;
  labels: string[];
}) {
  const { account } = useStore();
  const color = isIncluded ? "green" : "red";

  return (
    <div
      onClick={() => onCheckboxChange(!checked)}
      style={{
        backgroundColor: isIncluded ? "#e0ffe1" : "#ffe0e0",
        border: checked ? `3px solid black` : "1px solid black",
        marginTop: checked ? -2 : 2,
        marginLeft: checked ? 0 : 2,
        marginRight: checked ? 0 : 2,
        marginBottom: checked ? 10 : 12,
        borderRadius: "5px",
        padding: "10px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>
          {account?.accountDisplayName} ·{" "}
          {new Date(tweet.created_at).toLocaleString()}
        </span>
        <span style={{ color: color }}>
          {isIncluded ? "included" : "excluded"}
        </span>
      </div>
      <div style={{ margin: "10px 0" }}>&quot;{tweet.full_text}&quot;</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          {labels.map((label, index) => (
            <a href={`#/filters/${label}`}>
              <div
                style={{
                  backgroundColor: "white",
                  borderColor: "#e0e0e0",
                  borderStyle: "solid",
                  borderWidth: "1px",
                  borderRadius: "15px",
                  padding: "5px 10px",
                  display: "inline-block",
                  fontSize: "12px",
                  color: "#333",
                }}
                key={index}
              >
                {label}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
