import { useEffect, useMemo, useState } from "react";
import { useStore } from "../state/store";
import { UploadPanel } from "./UploadView";
import { ModelQuerySection } from "./query_view/ModelQueryView";

function ArchiveSummaryCard() {
  const { account, allTweets, clearDatabase, profile } = useStore();
  const [showProfilePicture, setShowProfilePicture] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetch(profile.avatarMediaUrl).then((response) => {
      if (response.status === 200) setShowProfilePicture(true);
    });
  }, [profile]);

  const { totalTweetsCount, originalTweetsCount, repliesCount, retweetsCount } =
    useMemo(() => {
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
        padding: "26px 28px",
        borderRadius: "20px",
        boxShadow: "0 3px 16px 2px rgba(30,60,160,0.07)",
        display: "flex",
        alignItems: "center",
        gap: "28px",
      }}
    >
      <div
        style={{
          minWidth: 80,
          minHeight: 80,
          background: "linear-gradient(135deg,#ced9fd 70%,#e2edfa 100%)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.2rem",
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
              width: 78,
              height: 78,
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
          gap: "7px",
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: "1.2em",
            fontWeight: 800,
            color: "#223259",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span>{account.accountDisplayName}</span>
          <span style={{ color: "#5b92ee", fontWeight: 600 }}>
            @{account.username}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px 18px",
            flexWrap: "wrap",
            color: "#607399",
            fontSize: "1em",
          }}
        >
          <span style={{ display: "flex", alignItems: "center" }}>
            <span
              role="img"
              aria-label="Email"
              style={{
                marginRight: "5px",
                fontSize: "1em",
              }}
            >
              📧
            </span>
            {account.email}
          </span>
          <span style={{ display: "flex", alignItems: "center" }}>
            <span
              role="img"
              aria-label="Calendar"
              style={{
                marginRight: "5px",
                fontSize: "1em",
              }}
            >
              📅
            </span>
            <span>
              Joined{" "}
              {new Date(account.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: "6px 24px",
            flexWrap: "wrap",
            color: "#223259",
            fontSize: "1em",
            fontWeight: 600,
            marginTop: "4px",
          }}
        >
          <span>Total posts: {totalTweetsCount}</span>
          <span>Tweets: {originalTweetsCount}</span>
          <span>Replies: {repliesCount}</span>
          <span>Retweets: {retweetsCount}</span>
        </div>
      </div>
      <button
        style={{
          borderRadius: "5px",
          marginLeft: "18px",
          marginBottom: "-2px",
          padding: "6px 16px",
          backgroundColor: "#f8d7da",
          border: "1px solid #f5c2c7",
          fontSize: "16px",
          cursor: "pointer",
          color: "#721c24",
          width: "fit-content",
        }}
        onClick={() => {
          if (
            confirm(
              "Close this archive? You will have to upload a ZIP file again.",
            )
          ) {
            clearDatabase();
          }
        }}
      >
        Close Archive
      </button>
    </section>
  );
}

export function MyArchiveView() {
  const { allTweets, account } = useStore();
  const hasArchiveLoaded = (allTweets?.length || 0) > 0 && !!account;

  return (
    <div style={{ height: "100vh", overflowY: "scroll" }}>
      <div
        style={{
          maxHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          padding: "0 20px",
          margin: "0 auto",
          maxWidth: "1200px",
        }}
      >
        {hasArchiveLoaded ? (
          <>
            <h1>My Archive</h1>
            <ArchiveSummaryCard />
            <ModelQuerySection />
          </>
        ) : (
          <UploadPanel />
        )}
      </div>
    </div>
  );
}
