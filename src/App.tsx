import "./App.css";

function Sidebar() {
  return (
    <div
      style={{ width: "250px", borderRight: "1px solid #ccc", padding: "10px" }}
    >
      <h1>Tweet Archive Explorer</h1>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        <li>All tweets</li>
        <li>Included 👍</li>
        <li>Excluded 👎</li>
        <li>Offensive 🤬</li>
        <li>NSFW 🔞</li>
        <li>Beef 🐄</li>
      </ul>
    </div>
  );
}

const getColorByStatus = (status: string) => {
  switch (status) {
    case "excluded":
      return { borderColor: "red", textColor: "red" };
    case "included":
      return { borderColor: "green", textColor: "green" };
    default:
      return { borderColor: "gray", textColor: "black" };
  }
};

function App() {
  const tweets = [
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
          {tweets.map((tweet, index) => {
            const { borderColor, textColor } = getColorByStatus(tweet.status);
            return (
              <div
                key={index}
                style={{
                  border: `1px solid ${borderColor}`,
                  borderRadius: "5px",
                  padding: "10px",
                  marginBottom: "10px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gridTemplateRows: "auto auto auto",
                  gap: "10px",
                }}
              >
                <input
                  type="checkbox"
                  style={{ gridColumn: "1", gridRow: "1" }}
                />
                <span
                  style={{ gridColumn: "3", gridRow: "1", color: textColor }}
                >
                  {tweet.status}
                </span>
                <p style={{ gridColumn: "2", gridRow: "2", margin: 0 }}>
                  &quot;{tweet.text}&quot;
                </p>
                <span style={{ gridColumn: "1", gridRow: "3" }}>
                  {new Date(tweet.created).toLocaleString()}
                </span>
                {tweet.label && (
                  <span style={{ gridColumn: "3", gridRow: "3" }}>
                    {tweet.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
