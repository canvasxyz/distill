import { useEffect, useMemo, useState } from "react";
import { useStore } from "../state/store";
import { UploadPanel } from "./UploadView";
import { ModelQuerySection } from "./query_view/ModelQueryView";
import { useNavigate } from "react-router";
import { LoadingView } from "./LoadingView";
import { FeedbackButtons } from "../components/FeedbackButtons";

function ArchiveSummaryCard() {
  const navigate = useNavigate();

  const { account, allTweets, clearDatabase, profile, viewingMyArchive } =
    useStore();
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
        padding: "18px 22px",
        borderRadius: "20px",
        boxShadow: "0 3px 16px 2px rgba(30,60,160,0.07)",
        display: "flex",
        alignItems: "center",
        gap: "20px",
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
          fontSize: "1.7rem",
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
        }}
      >
        <div
          style={{
            fontSize: "1.2em",
            fontWeight: 800,
            color: "#223259",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: -1,
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
            gap: "0 18px",
            flexWrap: "wrap",
            fontSize: "1em",
            color: "#607399",
          }}
        >
          <span>{totalTweetsCount} tweets</span>
          <span>{repliesCount} replies</span>
          <span>{retweetsCount} retweets</span>
          {account.createdAt && (
            <span>
              Since{" "}
              {new Date(account.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
      {viewingMyArchive && (
        <button
          style={{
            borderRadius: "5px",
            marginLeft: "18px",
            marginBottom: "-2px",
            padding: "6px 16px",
            backgroundColor: "#e5f0ff",
            border: "1px solid #9bc1f7",
            fontSize: "16px",
            cursor: "pointer",
            color: "#194486",
            width: "fit-content",
          }}
          onClick={() => {
            navigate("/all-tweets");
          }}
        >
          View Tweets
        </button>
      )}
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
          const message =
            "Close the archive? You will have to fetch or upload these tweets again.";
          if (confirm(message)) clearDatabase();
        }}
      >
        Close Archive
      </button>
    </section>
  );
}

export function MyArchiveView() {
  const { appIsReady, dbHasTweets } = useStore();

  return (
    <div style={{ height: "100vh", overflowY: "scroll" }}>
      {appIsReady ? (
        <div
          style={{
            maxHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            padding: "15px 20px",
            margin: "0 auto",
            maxWidth: "1200px",
          }}
        >
          {dbHasTweets ? (
            <>
              <ArchiveSummaryCard />
              <ModelQuerySection />
              <FeedbackButtons />
            </>
          ) : (
            <UploadPanel />
          )}
        </div>
      ) : (
        <LoadingView />
      )}
    </div>
  );
}
