import { useStore } from "./store";
import type { Tweet } from "./types";

export function TweetEntry({
  isFirst,
  tweet,
  onCheckboxChange,
  checked,
  isIncluded,
  labels,
}: {
  isFirst: boolean;
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
        marginTop: checked ? (isFirst ? 2 : -2) : 4,
        marginLeft: checked ? 0 : 2,
        marginRight: checked ? 0 : 2,
        marginBottom: checked ? 10 : 12,
        borderRadius: "5px",
        padding: "5px",
        paddingTop: "8px",
        paddingBottom: "8px",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <div>
        {/* checkbox goes here */}
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onCheckboxChange(!checked)}
        />
      </div>

      <div
        style={{
          marginLeft: "5px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* username */}
        <div>
          {account?.accountDisplayName} ·{" "}
          {new Date(tweet.created_at).toLocaleString()}
        </div>
        {/* tweet body */}
        <span>&quot;{tweet.full_text}&quot;</span>
        {/* labels */}
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

      <div style={{ marginLeft: "auto" }}>
        {/* included or excluded */}
        <span style={{ color: color }}>
          {isIncluded ? "included" : "excluded"}
        </span>
      </div>
    </div>
  );
}
