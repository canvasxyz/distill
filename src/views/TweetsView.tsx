import { useRef } from "react";
import { TweetEntry } from "../components/TweetEntry";

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

  return (
    <div
      style={{ height: "100vh", overflowY: "auto", scrollbarGutter: "stable" }}
    >
      <div
        style={{
          maxHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          paddingLeft: "10px",
          paddingRight: "10px",
          margin: "0 auto",
          maxWidth: "1200px", // limit width for readability on large screens
        }}
      >
        <h1>{title}</h1>
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
              border: "1px solid #ccc",
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
            paddingBottom: "10px",
            justifyContent: "end",
          }}
        >
          <button
            disabled={!navigatePrevious}
            onClick={navigatePrevious}
            style={{
              backgroundColor: "white",
              borderRadius: "5px",
              padding: "5px",
              border: "1px solid black",
              transition: "background-color 0.1s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0f0f0")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
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
            style={{
              backgroundColor: "white",
              borderRadius: "5px",
              padding: "5px",
              border: "1px solid black",
              transition: "background-color 0.1s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0f0f0")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
