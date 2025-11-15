import { useRef } from "react";
import { TweetEntry } from "../components/TweetEntry";
import { Button } from "@radix-ui/themes";

import type { Tweet } from "../types";
import { useSearchParams } from "react-router";

export function TweetsView({
  searchParam,
  allTweets,
  tweetsToDisplay,
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

  return (
    <div
      style={{
        scrollbarGutter: "stable",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          paddingLeft: "16px",
          paddingRight: "16px",
          paddingTop: "16px",
          margin: "0 auto",
          maxWidth: "1200px", // limit width for readability on large screens
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        {blurb && (
          <div style={{ marginBottom: "10px" }}>
            <em>{blurb}</em>
          </div>
        )}
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Search tweets..."
            value={searchParam ?? ""}
            onChange={(e) => {
              setSearchParams({ search: e.target.value });
            }}
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "6px 8px",
              marginRight: "10px",
              border: "1px solid var(--gray-6)",
              borderRadius: "4px",
              fontSize: "16px",
            }}
          />
          {allTweets.length} tweets
        </div>

        <div style={{ overflowY: "auto", flexGrow: 1 }} ref={listRef}>
          {tweetsToDisplay.map((tweet, index) => (
            <TweetEntry tweet={tweet} key={index} />
          ))}
        </div>

        <div
          style={{
            gap: "10px",
            display: "flex",
            flexDirection: "row",
            paddingTop: "10px",
            paddingBottom: "25px",
          }}
        >
          <Button
            disabled={!navigatePrevious}
            onClick={navigatePrevious}
            variant="outline"
            size="2"
          >
            Previous
          </Button>
          <Button
            disabled={!navigateNext}
            onClick={async () => {
              if (navigateNext) {
                navigateNext();
                if (listRef && listRef.current) {
                  listRef.current.scrollTop = 0;
                }
              }
            }}
            variant="outline"
            size="2"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
