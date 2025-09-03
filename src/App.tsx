import "./App.css";
import { Sidebar } from "./Sidebar";
import { TweetEntry } from "./TweetEntry";
import type { Tweet } from "./types";

function App() {
  const tweets: Tweet[] = [
    {
      text: "I find people who go to McDonald's to be absolutely disgusting",
      status: "excluded",
      label: "Offensive",
      created: "2023-10-01T10:15:30Z",
    },
    {
      text: "Good morning! The weather in Amsterdam is beautiful right now.",
      status: "included",
      label: "",
      created: "2023-10-02T08:45:00Z",
    },
  ];

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
          <button>Select all</button>
          <button style={{ backgroundColor: "green", color: "white" }}>
            Include
          </button>
          <button style={{ backgroundColor: "red", color: "white" }}>
            Exclude
          </button>
        </div>

        {/* Tweet card container */}
        <div>
          {tweets.map((tweet, index) => (
            <TweetEntry tweet={tweet} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
