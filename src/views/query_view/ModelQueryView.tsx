import { useState } from "react";
import { ShowIfTweetsLoaded } from "../ShowIfTweetsLoaded";
import { RunQueries } from "./RunQueries";
import { CustomQuery } from "./CustomQuery";

function ModelQueryViewInner() {
  const TABS = [
    { label: "Queries", key: "run-queries" },
    { label: "Custom Query", key: "custom-query" },
  ];
  const [activeTab, setActiveTab] = useState(TABS[0].key);

  return (
    <div style={{ height: "100vh", overflowY: "scroll" }}>
      <div
        style={{
          maxHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          paddingLeft: "10px",
          paddingRight: "10px",
          margin: "0 auto",
          maxWidth: "1200px", // limit width for readability on large screens
          boxSizing: "border-box",
        }}
      >
        <h1>Run Queries</h1>

        {/* Tab Menu */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #ddd",
            marginTop: "24px",
            gap: "8px",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key ? "#f5f5f5" : "transparent",
                border: "none",
                borderBottom:
                  activeTab === tab.key
                    ? "3px solid #007bff"
                    : "3px solid transparent",
                color: activeTab === tab.key ? "#007bff" : "#333",
                fontWeight: activeTab === tab.key ? "bold" : "normal",
                padding: "12px 20px",
                cursor: "pointer",
                outline: "none",
                fontSize: "16px",
                transition: "color 0.2s, border-bottom 0.2s, background 0.2s",
                borderRadius: "6px 6px 0 0",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "run-queries" && <RunQueries />}
        {activeTab === "custom-query" && <CustomQuery />}
      </div>
    </div>
  );
}

export function ModelQueryView() {
  return (
    <ShowIfTweetsLoaded>
      <ModelQueryViewInner />
    </ShowIfTweetsLoaded>
  );
}
