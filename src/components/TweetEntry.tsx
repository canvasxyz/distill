import type { Tweet } from "../types";
import { useStore } from "../state/store";

export function TweetEntry({ tweet }: { tweet: Tweet }) {
  const { account } = useStore();

  return (
    <div className="mx-0.5 mb-3 mt-1 flex flex-row rounded-md border border-[#b3ffb5] bg-[#e0ffe1] p-2">
      <div className="ml-[5px] flex flex-col gap-2.5">
        {/* username */}
        <div className="text-sm text-slate-700">
          <span className="font-medium text-slate-900">
            {account?.accountDisplayName}
          </span>{" "}
          ·{" "}
          <a
            href={`https://x.com/${account?.username}/status/${tweet.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4287f5] underline-offset-2 hover:underline"
          >
            {new Date(tweet.created_at).toLocaleString()}
          </a>
        </div>
        {/* tweet body */}
        <span className="text-base leading-relaxed text-slate-800">
          &quot;{tweet.full_text}&quot;
        </span>
        {/* labels */}
        <div className="flex gap-2.5 text-xs text-slate-600">
          <span
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium"
            title="Favorites"
          >
            ⭐ {tweet.favorite_count}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium"
            title="Retweets"
          >
            🔁 {tweet.retweet_count}
          </span>
        </div>
      </div>
    </div>
  );
}
