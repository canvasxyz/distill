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
      <div className="max-h-screen flex flex-col px-[10px] mx-auto max-w-[1200px]">
        <h1>{title}</h1>
        {blurb && (
          <div className="mb-[10px]">
            <em>{blurb}</em>
          </div>
        )}
        <div className="mb-[10px]">
          <input
            type="text"
            placeholder="Search tweets..."
            value={searchParam ?? ""}
            onChange={(e) => {
              setSearchParams({ search: e.target.value });
            }}
            className="w-full max-w-[400px] p-[6px_8px] mr-[10px] border border-gray-300 rounded text-base"
          />
          {allTweets.length} tweets
        </div>

        <div className="overflow-y-auto flex-grow" ref={listRef}>
          {tweetsToDisplay.map((tweet, index) => (
            <TweetEntry tweet={tweet} key={index} />
          ))}
        </div>

        <div className="gap-[10px] flex flex-row pt-[10px] pb-[10px] justify-end">
          <button
            disabled={!navigatePrevious}
            onClick={navigatePrevious}
            className="bg-white rounded-[5px] p-[5px] border border-black transition-colors duration-100 hover:bg-gray-100"
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
            className="bg-white rounded-[5px] p-[5px] border border-black transition-colors duration-100 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
