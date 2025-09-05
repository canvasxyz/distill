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
      <div style={{ margin: "10px 0" }}>&quot;{tweet.full_text}&quot;</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{new Date(tweet.created_at).toLocaleString()}</span>
        <div style={{ display: "flex", gap: "10px" }}>
          {labels.map((label, index) => (
            <a href={`#/filters/${label}`}>
              <div
                style={{
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
