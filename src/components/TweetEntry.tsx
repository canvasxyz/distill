import type { Tweet } from "../types";
import { useStore } from "../state/store";

export function TweetEntry({ tweet }: { tweet: Tweet }) {
  const { account } = useStore();

  return (
    <div className="bg-[#e0ffe1] border border-[#b3ffb5] mt-1 mx-[2px] mb-3 rounded-[5px] p-2 flex flex-row">
      <div className="ml-[5px] flex flex-col gap-[10px]">
        {/* username */}
        <div>
          {account?.accountDisplayName} ·{" "}
          <a
            href={`https://x.com/${account?.username}/status/${tweet.id}`}
            target="_blank"
            className="text-[#4287f5]"
          >
            {new Date(tweet.created_at).toLocaleString()}
          </a>
        </div>
        {/* tweet body */}
        <span>&quot;{tweet.full_text}&quot;</span>
        {/* labels */}
        <div className="flex gap-[10px]">
          <span
            className="bg-white border border-gray-200 rounded-xl py-[2px] px-2 text-xs text-gray-800 inline-flex items-center font-medium gap-1"
            title="Favorites"
          >
            ⭐ {tweet.favorite_count}
          </span>
          <span
            className="bg-white border border-gray-200 rounded-xl py-[2px] px-2 text-xs text-gray-800 inline-flex items-center font-medium gap-1"
            title="Retweets"
          >
            🔁 {tweet.retweet_count}
          </span>
        </div>
      </div>
    </div>
  );
}
