import type { Tweet } from "../types";
import { useStore } from "../state/store";
import { Badge } from "@radix-ui/themes";

export function TweetEntry({ tweet }: { tweet: Tweet }) {
  const { account } = useStore();

  const borderColor = "#b3ffb5";

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
        {/* labels */}
        <div style={{ display: "flex", gap: "10px" }}>
          <Badge variant="surface" title="Favorites">
            ⭐ {tweet.favorite_count}
          </Badge>
          <Badge variant="surface" title="Retweets">
            🔁 {tweet.retweet_count}
          </Badge>
        </div>
      </div>
    </div>
  );
}
