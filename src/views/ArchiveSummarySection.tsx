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

  const { totalTweetsCount, repliesCount, retweetsCount } =
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
    <section className="mx-auto flex max-w-[190px] flex-col items-center gap-2.5 rounded-3xl bg-[#eceff7] px-5 py-4 text-center shadow-lg shadow-indigo-100">
      <div
        className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-full border-2 border-[#afcfef] bg-[radial-gradient(circle_at_top_left,_#ced9fd_0%,_#e2edfa_100%)] text-lg font-bold uppercase tracking-wide text-[#5078B3] shadow"
        title={account.accountDisplayName}
      >
        {showProfilePicture ? (
          <img
            src={profile?.avatarMediaUrl}
            alt={account.accountDisplayName || account.username}
            className="h-[58px] w-[58px] rounded-full border-2 border-[#afcfef] object-cover shadow"
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
      <div className="flex flex-1 flex-col gap-1.5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-1 text-xl font-extrabold text-slate-800">
          <span>{account.accountDisplayName}</span>{" "}
          <span className="text-[#5b92ee]">@{account.username}</span>
        </div>
        <div className="text-sm text-slate-600">
          <span>
            {totalTweetsCount}&nbsp;tweets {repliesCount}&nbsp;replies{" "}
            {retweetsCount}&nbsp;retweets
          </span>
        </div>
        {account.createdAt && (
          <div className="text-sm text-slate-600">
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
