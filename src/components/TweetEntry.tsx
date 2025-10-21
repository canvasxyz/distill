import type { FilterMatch, Tweet } from "../types";
import { useStore } from "../state/store";

export function TweetEntry({
  isFirst,
  tweet,
  onCheckboxChange,
  checked,
  isIncluded,
  filterMatches,
}: {
  isFirst: boolean;
  tweet: Tweet;
  onCheckboxChange: (isChecked: boolean) => void;
  checked: boolean;
  isIncluded: boolean;
  filterMatches: FilterMatch[];
}) {
  const { account } = useStore();
  const color = isIncluded ? "green" : "red";

  // Find all regex matches from labels
  // Each match: { start: number, end: number }
  type MatchRange = { start: number; end: number };
  const matchRanges: MatchRange[] = [];

  filterMatches.forEach((filterMatch) => {
    if (
      filterMatch &&
      filterMatch.type === "regex" &&
      filterMatch.filterName &&
      filterMatch.regexMatch &&
      typeof filterMatch.regexMatch.index === "number"
    ) {
      const matchText = filterMatch.regexMatch[0];
      const start = filterMatch.regexMatch.index;
      if (typeof start === "number" && matchText) {
        matchRanges.push({ start, end: start + matchText.length });
      }
    }
  });

  // Merge overlapping/adjacent ranges
  matchRanges.sort((a, b) => a.start - b.start);
  const mergedRanges: MatchRange[] = [];
  for (const range of matchRanges) {
    if (
      mergedRanges.length > 0 &&
      range.start <= mergedRanges[mergedRanges.length - 1].end
    ) {
      // Overlap or adjacent, merge
      mergedRanges[mergedRanges.length - 1].end = Math.max(
        mergedRanges[mergedRanges.length - 1].end,
        range.end
      );
    } else {
      mergedRanges.push({ ...range });
    }
  }

  // Split tweet.full_text into parts, highlighting matches
  const highlightedTweetParts: React.ReactNode[] = [];
  let lastIndex = 0;
  for (const { start, end } of mergedRanges) {
    if (lastIndex < start) {
      highlightedTweetParts.push(
        <span key={lastIndex + "-plain"}>
          {tweet.full_text.slice(lastIndex, start)}
        </span>
      );
    }
    highlightedTweetParts.push(
      <span
        key={start + "-highlight"}
        style={{
          backgroundColor: "#fff3b0",
          fontWeight: "bold",
          borderRadius: "3px",
          padding: "0 2px",
        }}
      >
        {tweet.full_text.slice(start, end)}
      </span>
    );
    lastIndex = end;
  }
  if (lastIndex < tweet.full_text.length) {
    highlightedTweetParts.push(
      <span key={lastIndex + "-plain-end"}>
        {tweet.full_text.slice(lastIndex)}
      </span>
    );
  }

  const borderColor = isIncluded ? "#b3ffb5" : "#ffb5b5";

  return (
    <div
      style={{
        backgroundColor: isIncluded ? "#e0ffe1" : "#ffe0e0",
        border: checked
          ? `3px solid ${borderColor}`
          : `1px solid ${borderColor}`,
        marginTop: checked ? (isFirst ? 2 : -2) : 4,
        marginLeft: checked ? 0 : 2,
        marginRight: checked ? 0 : 2,
        marginBottom: checked ? 10 : 12,
        borderRadius: "5px",
        padding: "8px",
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
          <a
            href={`https://x.com/${account?.username}/status/${tweet.id}`}
            target="_blank"
            style={{ color: "#4287f5" }}
          >
            {new Date(tweet.created_at).toLocaleString()}
          </a>
        </div>
        {/* tweet body */}
        <span>&quot;{highlightedTweetParts}&quot;</span>
        {/* labels */}
        <div style={{ display: "flex", gap: "10px" }}>
          <span
            style={{
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              padding: "2px 8px",
              fontSize: "12px",
              color: "#333",
              display: "inline-flex",
              alignItems: "center",
              fontWeight: 500,
              gap: "4px",
            }}
            title="Favorites"
          >
            ⭐ {tweet.favorite_count}
          </span>
          <span
            style={{
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              padding: "2px 8px",
              fontSize: "12px",
              color: "#333",
              display: "inline-flex",
              alignItems: "center",
              fontWeight: 500,
              gap: "4px",
            }}
            title="Retweets"
          >
            🔁 {tweet.retweet_count}
          </span>
          {filterMatches.map((label, index) => (
            <a href={`#/filters/${label.filterName}`} key={index}>
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
              >
                {label.filterName}
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
