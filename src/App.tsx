import { useState } from "react";
import "./App.css";
import { Sidebar } from "./Sidebar";
import { TweetEntry } from "./TweetEntry";
import type { Tweet } from "./types";

function App() {
  const [tweets, setTweets] = useState<Tweet[]>([
    {
      id: "1",
      text: "I find people who go to McDonald's to be absolutely disgusting",
      label: "Offensive",
      created: "2023-10-01T10:15:30Z",
    },
    {
      id: "2",
      text: "Good morning! The weather in Amsterdam is beautiful right now.",
      label: "",
      created: "2023-10-02T08:45:00Z",
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
          }}
        >
          <button onClick={handleSelectAll}>Select all</button>
          <button
            onClick={handleInclude}
            style={{ backgroundColor: "green", color: "white" }}
          >
            Include
          </button>
          <button
            onClick={handleExclude}
            style={{ backgroundColor: "red", color: "white" }}
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
