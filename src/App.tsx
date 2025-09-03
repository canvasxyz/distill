import { useState } from "react";
import "./App.css";
import { Sidebar } from "./Sidebar";
import { TweetEntry } from "./TweetEntry";
import type { Tweet } from "./types";

function App() {
  const [tweets, setTweets] = useState<Tweet[]>([
    {
      id: "1",
      id_str: "1",
      full_text:
        "I find people who go to McDonald's to be absolutely disgusting",
      created_at: "2023-10-01T10:15:30Z",
      retweet_count: "0",
      favorite_count: "0",
      favorited: false,
      retweeted: false,
      truncated: false,
      lang: "en",
      source:
        '<a href="https://mobile.twitter.com" rel="nofollow">Twitter Web App</a>',
      raw_json: "",
    },
    {
      id: "2",
      id_str: "2",
      full_text:
        "Good morning! The weather in Amsterdam is beautiful right now.",
      created_at: "2023-10-02T08:45:00Z",
      retweet_count: "0",
      favorite_count: "0",
      favorited: false,
      retweeted: false,
      truncated: false,
      lang: "en",
      source:
        '<a href="https://mobile.twitter.com" rel="nofollow">Twitter Web App</a>',
      raw_json: "",
    },
  ]);

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
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ flexGrow: 1, padding: "10px" }}>
        {/* Main content controls */}
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
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "red")
            }
          >
            Exclude
          </button>
        </div>

        {/* Tweet card container */}
        <div>
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
              labels={["Offensive", "Beef"]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
