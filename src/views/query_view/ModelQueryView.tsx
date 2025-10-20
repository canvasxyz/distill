import { useState } from "react"
import { ShowIfTweetsLoaded } from "../ShowIfTweetsLoaded"
import { RunQueries } from "./RunQueries"
import { PastQueries } from "./PastQueries"

type HeadingLevel = "h1" | "h2" | "h3"

export function ModelQuerySection({
  headingLevel = "h2",
}: {
  headingLevel?: HeadingLevel
} = {}) {
  const TABS = [
    { label: "Run Query", key: "run-queries" },
    { label: "Past Queries", key: "past-queries" },
  ]
  const [activeTab, setActiveTab] = useState(TABS[0].key)

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        marginBottom: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #ddd",
          marginTop: "16px",
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

      {activeTab === "run-queries" && <RunQueries />}
      {activeTab === "past-queries" && <PastQueries />}
    </section>
  )
}

export function ModelQueryView() {
  return (
    <ShowIfTweetsLoaded>
      <div style={{ height: "100vh", overflowY: "scroll" }}>
        <div
          style={{
            maxHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            paddingLeft: "10px",
            paddingRight: "10px",
            margin: "0 auto",
            maxWidth: "1200px",
          }}
        >
          <ModelQuerySection headingLevel="h1" />
        </div>
      </div>
    </ShowIfTweetsLoaded>
  )
}
