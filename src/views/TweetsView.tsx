import { useRef } from "react";
import { TweetEntry } from "../components/TweetEntry";

import { UploadView } from "./UploadView";
import type { Tweet } from "../types";
import { useSearchParams } from "react-router";

export function TweetsView({
  searchParam,
  allTweets,
  tweetsToDisplay,
  title,
  blurb,
  navigateNext,
  navigatePrevious,
}: {
  searchParam: string | null;
  allTweets: Tweet[];
  tweetsToDisplay: Tweet[];
  title: string;
  blurb?: string;
  navigateNext?: () => void;
  navigatePrevious?: () => void;
}) {
  const [, setSearchParams] = useSearchParams();

  const listRef = useRef<HTMLDivElement>(null);

  if (tweetsToDisplay === null) {
    return <UploadView />;
  }

  return (
    <div className="h-screen overflow-y-auto [scrollbar-gutter:stable]">
      <div className="mx-auto flex max-h-screen w-full max-w-6xl flex-col px-3 py-4">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {blurb && (
          <div className="mb-2.5 text-sm text-slate-600">
            <em>{blurb}</em>
          </div>
        )}
        <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <input
            type="text"
            placeholder="Search tweets..."
            value={searchParam ?? ""}
            onChange={(e) => {
              setSearchParams({ search: e.target.value });
            }}
            className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-base text-slate-800 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <span className="text-sm text-slate-600">
            {allTweets.length} tweets
          </span>
        </div>

        <div className="flex-1 overflow-y-auto" ref={listRef}>
          {tweetsToDisplay.map((tweet, index) => (
            <TweetEntry tweet={tweet} key={index} />
          ))}
        </div>

        <div className="flex flex-row justify-end gap-2.5 py-2">
          <button
            disabled={!navigatePrevious}
            onClick={navigatePrevious}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={!navigateNext}
            onClick={async () => {
              if (navigateNext) {
                navigateNext();
                if (listRef && listRef.current) {
                  listRef.current.scrollTop = 0;
                }
              }
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
