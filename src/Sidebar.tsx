export function Sidebar({
  currentView,
  setCurrentView,
}: {
  currentView: string;
  setCurrentView: (newView: string) => void;
}) {
  const itemStyle = {
    border: "1px solid darkgray",
    borderRadius: "5px",
    padding: "5px",
    transition: "background-color 0.1s",
  };

  const hoverStyle = {
    backgroundColor: "#f0f0f0",
  };

  const filters = [
    { label: "Embarrassing 🫣", name: "embarrassing" },
    { label: "Beef 🐄", name: "beef" },
    { label: "Illegal 🧑‍⚖️", name: "illegal" },
    { label: "Controversial ⁉️", name: "controversial" },
    { label: "Offensive 🤬", name: "offensive" },
    { label: "NSFW 🔞", name: "nsfw" },
  ];

  return (
    <div
      style={{
        width: "250px",
        borderRight: "1px solid #ccc",
        paddingLeft: "10px",
        paddingRight: "10px",
      }}
    >
      <h1 style={{ fontSize: "22px" }}>Tweet Archive Explorer</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            ...itemStyle,
            backgroundColor: currentView === `all-tweets` ? "#d6d6d6" : "",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              currentView === `all-tweets` ? "#d6d6d6" : "")
          }
          onClick={() => setCurrentView("all-tweets")}
        >
          All tweets
        </div>
        <div
          style={{
            ...itemStyle,
            border: "1px solid green",
            backgroundColor: currentView === `included-tweets` ? "#d6d6d6" : "",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              currentView === `included-tweets` ? "#d6d6d6" : "")
          }
          onClick={() => setCurrentView("included-tweets")}
        >
          Included 👍
        </div>
        <div
          style={{
            ...itemStyle,
            border: "1px solid red",
            backgroundColor: currentView === `excluded-tweets` ? "#d6d6d6" : "",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              currentView === `excluded-tweets` ? "#d6d6d6" : "")
          }
          onClick={() => setCurrentView("excluded-tweets")}
        >
          Excluded 👎
        </div>
        <hr
          style={{
            margin: "20px 0",
            border: "none",
            borderTop: "1px solid #ccc",
          }}
        />

        {filters.map((filter, index) => (
          <div
            key={index}
            style={{
              ...itemStyle,
              backgroundColor:
                currentView === `filter-${filter.name}` ? "#d6d6d6" : "",
              cursor: "pointer",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                hoverStyle.backgroundColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor =
                currentView === `filter-${filter.name}` ? "#d6d6d6" : "")
            }
            onClick={() => setCurrentView(`filter-${filter.name}`)}
          >
            {filter.label}
          </div>
        ))}

        <hr
          style={{
            margin: "20px 0",
            border: "none",
            borderTop: "1px solid #ccc",
          }}
        />

        <button
          style={{
            ...itemStyle,
            border: "1px solid blue",
            backgroundColor: "white",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "white")
          }
        >
          Download Included Tweets
        </button>
      </div>
    </div>
  );
}
