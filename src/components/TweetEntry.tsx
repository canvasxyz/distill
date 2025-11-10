import type { Tweet } from "../types";
import { useStore } from "../state/store";
import { useMemo } from "react";

export function TweetEntry({ tweet }: { tweet: Tweet }) {
  const { accounts } = useStore();
  const account = useMemo(
    () => accounts.filter((a) => a.accountId === tweet.account_id)[0],
    [accounts, tweet],
  );

  const borderColor = "#b3ffb5";

  const imageUrls = tweet.tweet_media
    ? tweet.tweet_media.map((entry) => entry.media_url)
    : [];

  return (
    <div
      style={{
        backgroundColor: "#e0ffe1",
        border: `1px solid ${borderColor}`,
        marginTop: 4,
        marginLeft: 2,
        marginRight: 2,
        marginBottom: 12,
        borderRadius: "5px",
        padding: "8px",
        paddingTop: "8px",
        paddingBottom: "8px",
        display: "flex",
        flexDirection: "row",
      }}
    >
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
        <span>&quot;{tweet.full_text}&quot;</span>
        {/* If there are images, show them */}
        {imageUrls.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {imageUrls.map((url) => (
              <img
                key={url}
                src={url}
                alt="Tweet media"
                style={{
                  maxWidth: "180px",
                  maxHeight: "180px",
                  borderRadius: "6px",
                  objectFit: "cover",
                  border: "1px solid #c1e7c1",
                  marginTop: "2px",
                }}
              />
            ))}
          </div>
        )}
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
        </div>
      </div>
    </div>
  );
}
