import { NavLink } from "react-router";
import { filters } from "./filters";

export function Sidebar() {
  const itemStyle = {
    border: "1px solid darkgray",
    borderRadius: "5px",
    padding: "5px",
    transition: "background-color 0.1s",
    textDecoration: "none",
    cursor: "pointer",
    color: "black",
  };

  const hoverStyle = {
    backgroundColor: "#f0f0f0",
  };

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
        <NavLink
          to="/"
          style={({ isActive }) => ({
            ...itemStyle,
            backgroundColor: isActive ? "#d6d6d6" : "",
          })}
        >
          All tweets
        </NavLink>

        <NavLink
          to="/included-tweets"
          style={({ isActive }) => ({
            ...itemStyle,
            backgroundColor: isActive ? "#d6d6d6" : "",
          })}
        >
          Included 👍
        </NavLink>

        <NavLink
          to="/excluded-tweets"
          style={({ isActive }) => ({
            ...itemStyle,
            backgroundColor: isActive ? "#d6d6d6" : "",
          })}
        >
          Excluded 👎
        </NavLink>

        <hr
          style={{
            margin: "20px 0",
            border: "none",
            borderTop: "1px solid #ccc",
          }}
        />

        {filters.map((filter, index) => (
          <NavLink
            key={index}
            to={`/filters/${filter.name}`}
            style={({ isActive }) => ({
              ...itemStyle,
              backgroundColor: isActive ? "#d6d6d6" : "",
            })}
          >
            {filter.label}
          </NavLink>
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
