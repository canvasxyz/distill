import { useMemo, useState } from "react";
import { TweetEntry } from "./TweetEntry";
import type { Tweet } from "./types";
import { filters } from "./filters";

export function TweetsView({ tweets }: { tweets: Tweet[] }) {
  const [checkedTweets, setCheckedTweets] = useState<{
    [id: string]: boolean;
  }>({});

  const [includedTweets, setIncludedTweets] = useState<Record<string, boolean>>(
    tweets.reduce(
      (acc, tweet) => {
        acc[tweet.id] = true;
        return acc;
      },
      {} as Record<string, boolean>
    )
  );

  const [labelsByTweetId, labels] = useMemo(() => {
    const labelsByTweetId: Record<string, string[]> = {};
    const labels: Record<string, string[]> = {};

    console.log("running filters...");
    for (const tweet of tweets) {
      for (const filter of filters) {
        if (filter.shouldFilter(tweet)) {
          labelsByTweetId[tweet.id] ||= [];
          labelsByTweetId[tweet.id].push(filter.name);
          labels[filter.name] ||= [];
          labels[filter.name].push(tweet.id);
        }
      }
    }
    return [labelsByTweetId, labels];
  }, [tweets]);

  const handleIncludeExclude = (newStatus: "included" | "excluded") => {
    setIncludedTweets((prevIncludedTweets) => {
      const updatedIncludedTweets = { ...prevIncludedTweets };
      Object.keys(checkedTweets).forEach((id) => {
        if (checkedTweets[id]) {
          updatedIncludedTweets[id] = newStatus === "included";
        }
      });
      return updatedIncludedTweets;
    });
    setCheckedTweets({});
  };

  const handleSelectAll = () => {
    const allChecked = tweets.reduce(
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

  return (
    <div style={{ flexGrow: 1, padding: "10px" }}>
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          marginTop: "50px",
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
        {tweets.map((tweet, index) => (
          <TweetEntry
            tweet={tweet}
            checked={checkedTweets[tweet.id] || false}
            isIncluded={includedTweets[tweet.id]}
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
    </div>
  );
}
