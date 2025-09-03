export function Sidebar() {
  const itemStyle = {
    border: "1px solid darkgray",
    borderRadius: "5px",
    padding: "5px",
    transition: "background-color 0.1s",
  };

  const hoverStyle = {
    backgroundColor: "#f0f0f0",
  };

  return (
    <div
      style={{ width: "250px", borderRight: "1px solid #ccc", padding: "10px" }}
    >
      <h1>Tweet Archive Explorer</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={itemStyle}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor)
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
        >
          All tweets
        </div>
        <div
          style={{ ...itemStyle, border: "1px solid green" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor)
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
        >
          Included 👍
        </div>
        <div
          style={{ ...itemStyle, border: "1px solid red" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor)
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
        >
          Excluded 👎
        </div>
        <div
          style={itemStyle}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor)
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
        >
          Offensive 🤬
        </div>
        <div
          style={itemStyle}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor)
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
        >
          NSFW 🔞
        </div>
        <div
          style={itemStyle}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor)
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
        >
          Beef 🐄
        </div>
      </div>
    </div>
  );
}
