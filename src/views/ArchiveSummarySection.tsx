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
    <section className="bg-[#eceff7] p-4 px-[22px] rounded-[20px] shadow-[0_3px_16px_2px_rgba(30,60,160,0.07)] flex flex-col items-center gap-[10px] max-w-[190px] box-border mx-auto">
      <div
        className="min-w-[60px] min-h-[60px] bg-gradient-to-br from-[#ced9fd] via-[#ced9fd] to-[#e2edfa] rounded-full flex items-center justify-center text-[1.3rem] font-bold text-[#5078B3] tracking-wide shadow-[0_2px_6px_rgba(80,120,180,0.10)] border-2 border-[#afcfef] flex-shrink-0"
        title={account.accountDisplayName}
      >
        {showProfilePicture ? (
          <img
            src={profile?.avatarMediaUrl}
            alt={account.accountDisplayName || account.username}
            className="w-[58px] h-[58px] rounded-full object-cover border-2 border-[#afcfef] shadow-[0_2px_6px_rgba(80,120,180,0.10)]"
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
      <div className="flex flex-col gap-[6px] flex-1 text-center">
        <div className="font-extrabold text-[#223259] flex-wrap -mb-px">
          <span>{account.accountDisplayName}</span>{" "}
          <span className="text-[#5b92ee]">@{account.username}</span>
        </div>
        <div className="flex flex-col gap-x-[18px] flex-wrap text-[#607399] text-[94%]">
          <span>
            {totalTweetsCount}&nbsp;tweets {repliesCount}&nbsp;replies{" "}
            {retweetsCount}&nbsp;retweets
          </span>
        </div>
        {account.createdAt && (
          <div className="text-[#607399] text-[94%]">
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
