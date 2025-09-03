import { useState } from "react";
import "./App.css";
import { Sidebar } from "./Sidebar";
import type { Tweet } from "./types";
import { TweetsView } from "./TweetsView";
import { UploadView } from "./UploadView";

function App() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [currentView, setCurrentView] = useState("all-tweets");

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      {tweets.length > 0 ? (
        <TweetsView tweets={tweets.slice(0, 100)} />
      ) : (
        <UploadView setTweets={setTweets} />
      )}
    </div>
  );
}

export default App;
