import { useEffect, useMemo, useState } from "react";
import { useStore } from "../state/store";

export function ArchiveSummarySection() {
  const { account, allTweets, profile } = useStore();
  const [showProfilePicture, setShowProfilePicture] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetch(profile.avatarMediaUrl).then((response) => {
      if (response.status === 200) setShowProfilePicture(true);
    });
  }, [profile]);

  const { totalTweetsCount, repliesCount, retweetsCount } = useMemo(() => {
    const tweets = allTweets || [];
    let replies = 0;
    let retweets = 0;

    for (const tweet of tweets) {
      if (tweet.in_reply_to_user_id) {
        replies += 1;
        continue;
      }

      const text = tweet.full_text || "";
      if (text.trim().toUpperCase().startsWith("RT ")) {
        retweets += 1;
      }
    }

    const total = tweets.length;
    const original = Math.max(total - replies - retweets, 0);

    return {
      totalTweetsCount: total,
      originalTweetsCount: original,
      repliesCount: replies,
      retweetsCount: retweets,
    };
  }, [allTweets]);

  if (!account) {
    return null;
  }

  return (
    <section
      style={{
        background: "#eceff7",
        padding: "16px 22px 16px 22px",
        borderRadius: "20px",
        boxShadow: "0 3px 16px 2px rgba(30,60,160,0.07)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        maxWidth: 190,
        boxSizing: "border-box",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          minWidth: 60,
          minHeight: 60,
          background: "linear-gradient(135deg,#ced9fd 70%,#e2edfa 100%)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.3rem",
          fontWeight: 700,
          color: "#5078B3",
          letterSpacing: "1px",
          boxShadow: "0 2px 6px rgba(80,120,180,0.10)",
          border: "2px solid #afcfef",
          flexShrink: 0,
        }}
        title={account.accountDisplayName}
      >
        {showProfilePicture ? (
          <img
            src={profile?.avatarMediaUrl}
            alt={account.accountDisplayName || account.username}
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #afcfef",
              boxShadow: "0 2px 6px rgba(80,120,180,0.10)",
            }}
          />
        ) : account.accountDisplayName ? (
          account.accountDisplayName
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        ) : (
          "@"
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: 1,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontWeight: 800,
            color: "#223259",
            flexWrap: "wrap",
            marginBottom: -1,
          }}
        >
          <span>{account.accountDisplayName}</span>{" "}
          <span style={{ color: "#5b92ee" }}>@{account.username}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0 18px",
            flexWrap: "wrap",
            color: "#607399",
            fontSize: "94%",
          }}
        >
          <span>
            {totalTweetsCount}&nbsp;tweets {repliesCount}&nbsp;replies{" "}
            {retweetsCount}&nbsp;retweets
          </span>
        </div>
        {account.createdAt && (
          <div
            style={{
              color: "#607399",
              fontSize: "94%",
            }}
          >
            Since{" "}
            {new Date(account.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        )}
      </div>
    </section>
  );
}
