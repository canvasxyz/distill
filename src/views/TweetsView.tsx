import { useMemo, useState } from "react";
import { TweetEntry } from "../TweetEntry";

import { filters } from "../filters";
import { useStore } from "../store";
import { UploadView } from "./UploadView";

export function TweetsView() {
  const { tweets } = useStore();

  const [checkedTweets, setCheckedTweets] = useState<{
    [id: string]: boolean;
  }>({});

  const [excludedTweets, setExcludedTweets] = useState<Record<string, boolean>>(
    {}
  );

  const [labelsByTweetId] = useMemo(() => {
    const labelsByTweetId: Record<string, string[]> = {};
    const labels: Record<string, string[]> = {};

    console.log("running filters...");
    for (const tweet of tweets || []) {
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
    setExcludedTweets((prevExcludedTweets) => {
      const updatedExcludedTweets = { ...prevExcludedTweets };
      Object.keys(checkedTweets).forEach((id) => {
        if (checkedTweets[id]) {
          updatedExcludedTweets[id] = newStatus === "excluded";
        }
      });
      return updatedExcludedTweets;
    });
    setCheckedTweets({});
  };

  const handleSelectAll = () => {
    const allChecked = (tweets || []).reduce(
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

  if (tweets === null) {
    return <UploadView />;
  }

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
    </div>
  );
}
