import { useState } from "react";
import { TweetEntry } from "../TweetEntry";

import { useStore } from "../state/store";
import { UploadView } from "./UploadView";
import type { Tweet } from "../types";
import { PseudoLink } from "../PseudoLink";

export function TweetsView({
  allTweets,
  tweetsToDisplay,
  title,
  blurb,
  navigateNext,
  navigatePrevious,
}: {
  allTweets: Tweet[];
  tweetsToDisplay: Tweet[];
  title: string;
  blurb?: string;
  navigateNext?: () => void;
  navigatePrevious?: () => void;
}) {
  const {
    addExcludedTweets,
    removeExcludedTweets,
    excludedTweetIdsSet,
    filterMatchesByTweetId,
  } = useStore();

  const [checkedTweets, setCheckedTweets] = useState<{
    [id: string]: boolean;
  }>({});

  const [selectAllChecked, setSelectAllChecked] = useState(false);

  const onSelectAllChange = (value: boolean) => {
    setSelectAllChecked(value);
    if (value === true) {
      // check all tweets in the view
      const newChecked: Record<string, boolean> = {};
      for (const tweet of tweetsToDisplay) {
        newChecked[tweet.id] = true;
      }
      setCheckedTweets((existingCheckedTweets) => ({
        ...existingCheckedTweets,
        ...newChecked,
      }));
    } else {
      // uncheck all tweets
      setCheckedTweets({});
    }
  };

  const checkAllTweets = () => {
    const newCheckedTweets: Record<string, boolean> = {};
    for (const tweet of allTweets) {
      newCheckedTweets[tweet.id] = true;
    }
    setCheckedTweets(newCheckedTweets);
  };

  const handleIncludeExclude = (newStatus: "included" | "excluded") => {
    const checkedTweetIds = Object.keys(checkedTweets).filter(
      (tweetId) => checkedTweets[tweetId]
    );
    if (newStatus === "included") {
      removeExcludedTweets(checkedTweetIds);
    } else {
      addExcludedTweets(checkedTweetIds);
    }
    setSelectAllChecked(false);
    setCheckedTweets({});
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
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "10px",
          alignItems: "center",
        }}
      >
        <input
          checked={selectAllChecked}
          type="checkbox"
          onChange={(event) => onSelectAllChange(event.target.checked)}
        ></input>

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
        <div>
          {Object.keys(checkedTweets).length > 0 && (
            <>
              {Object.keys(checkedTweets).length} tweets are selected.{" "}
              <PseudoLink onClick={checkAllTweets}>
                Select all tweets in {title}.
              </PseudoLink>
            </>
          )}
        </div>
      </div>

      <div style={{ overflowY: "auto", flexGrow: 1 }}>
        {tweetsToDisplay.map((tweet, index) => (
          <TweetEntry
            isFirst={index === 0}
            tweet={tweet}
            checked={checkedTweets[tweet.id] || false}
            isIncluded={!excludedTweetIdsSet.has(tweet.id)}
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
            filterMatches={filterMatchesByTweetId[tweet.id] || []}
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
