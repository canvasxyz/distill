import "./App.css";

function Sidebar() {
  return (
    <div
      style={{ width: "250px", borderRight: "1px solid #ccc", padding: "10px" }}
    >
      <h2>All tweets 💬</h2>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        <li>Included 👍</li>
        <li>Excluded 👎</li>
        <li>Offensive 🤬</li>
        <li>NSFW 🔞</li>
        <li>Beef 🐄</li>
      </ul>
    </div>
  );
}

function App() {
  const tweets = [
    {
      text: "I find people who go to McDonald's to be absolutely disgusting",
      status: "excluded",
      label: "Offensive",
      borderColor: "red",
      textColor: "red",
    },
    {
      text: "Good morning! The weather in Amsterdam is beautiful right now.",
      status: "included",
      label: "",
      borderColor: "green",
      textColor: "green",
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
            justifyContent: "space-between",
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
            <div
              key={index}
              style={{
                border: `1px solid ${tweet.borderColor}`,
                borderRadius: "5px",
                padding: "10px",
                marginBottom: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ margin: 0 }}>{tweet.text}</p>
                <span style={{ color: tweet.textColor }}>{tweet.status}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: tweet.label ? "flex-end" : "flex-start",
                  marginTop: "10px",
                }}
              >
                {tweet.label ? (
                  <>
                    <button style={{ marginRight: "10px" }}>X</button>
                    <span>{tweet.label}</span>
                  </>
                ) : (
                  <input type="checkbox" style={{ marginRight: "10px" }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
