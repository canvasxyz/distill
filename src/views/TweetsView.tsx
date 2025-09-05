import { useState } from "react";
import { TweetEntry } from "../TweetEntry";

import { useStore } from "../store";
import { UploadView } from "./UploadView";
import type { Tweet } from "../types";

export function TweetsView({
  tweetsToDisplay,
  title,
  blurb,
  navigateNext,
  navigatePrevious,
}: {
  tweetsToDisplay: Tweet[];
  title: string;
  blurb?: string;
  navigateNext?: () => void;
  navigatePrevious?: () => void;
}) {
  const {
    labelsByTweetId,
    addExcludedTweets,
    removeExcludedTweets,
    excludedTweets,
  } = useStore();

  const [checkedTweets, setCheckedTweets] = useState<{
    [id: string]: boolean;
  }>({});

  const handleIncludeExclude = (newStatus: "included" | "excluded") => {
    const checkedTweetIds = Object.keys(checkedTweets).filter(
      (tweetId) => checkedTweets[tweetId]
    );
    if (newStatus === "included") {
      removeExcludedTweets(checkedTweetIds);
    } else {
      addExcludedTweets(checkedTweetIds);
    }
    setCheckedTweets({});
  };

  const handleSelectAll = () => {
    const allChecked = (tweetsToDisplay || []).reduce(
      (acc, tweet) => {
        acc[tweet.id] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );
    setCheckedTweets(allChecked);
  };

  const handleInclude = () => handleIncludeExclude("included");
  const handleExclude = () => handleIncludeExclude("excluded");

  if (tweetsToDisplay === null) {
    return <UploadView />;
  }

  return (
    <div
      style={{
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingLeft: "10px",
        paddingRight: "10px",
      }}
    >
      <h1>{title}</h1>
      {blurb && (
        <p>
          <em>{blurb}</em>
        </p>
      )}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={handleSelectAll}
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
          Select all
        </button>
        <button
          onClick={handleInclude}
          style={{
            backgroundColor: "green",
            color: "white",
            borderRadius: "5px",
            padding: "5px",
            border: "1px solid black",
            transition: "background-color 0.1s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#48c91a")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "green")
          }
        >
          Include
        </button>
        <button
          onClick={handleExclude}
          style={{
            backgroundColor: "red",
            color: "white",
            borderRadius: "5px",
            padding: "5px",
            border: "1px solid black",
            transition: "background-color 0.1s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#ff6661")
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "red")}
        >
          Exclude
        </button>
      </div>

      <div style={{ overflowY: "auto", flexGrow: 1 }}>
        {tweetsToDisplay.map((tweet, index) => (
          <TweetEntry
            tweet={tweet}
            checked={checkedTweets[tweet.id] || false}
            isIncluded={!excludedTweets[tweet.id]}
            key={index}
            onCheckboxChange={(isChecked) => {
              if (isChecked) {
                setCheckedTweets({ ...checkedTweets, [tweet.id]: true });
              } else {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [tweet.id]: _discard, ...newCheckedTweets } =
                  checkedTweets;
                setCheckedTweets(newCheckedTweets);
              }
            }}
            labels={labelsByTweetId[tweet.id] || []}
          />
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
          onClick={navigateNext}
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
  );
}
