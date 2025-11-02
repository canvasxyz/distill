import type { CSSProperties } from "react";
import { useNavigate, useLocation } from "react-router";
import { useStore } from "../state/store";
import {
  sidebarItemContainerBase,
  sidebarItemSubtitleBase,
  sidebarItemTitleBase,
} from "./sidebarStyles";

export const SidebarActions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearDatabase, dbHasTweets } = useStore();

  const buttonBaseStyle: CSSProperties = {
    ...sidebarItemContainerBase,
    width: "100%",
    border: "none",
    background: "transparent",
    outline: "none",
    textAlign: "left",
    font: "inherit",
  };

  const isViewingAllTweets = location.pathname === "/all-tweets";

  return (
    <div
      style={{
        margin: "20px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {dbHasTweets && (
        <button
          type="button"
          style={{
            ...buttonBaseStyle,
            background: isViewingAllTweets ? "#e3f2fd" : "transparent",
            color: "#194486",
          }}
          onClick={() => {
            navigate("/all-tweets");
          }}
          onMouseEnter={(e) => {
            if (!isViewingAllTweets) e.currentTarget.style.background = "#f7faff";
          }}
          onMouseLeave={(e) => {
            if (!isViewingAllTweets) e.currentTarget.style.background = "transparent";
          }}
        >
          <span
            style={{
              ...sidebarItemTitleBase,
              color: "#194486",
            }}
          >
            View Tweets
          </span>
          <span style={sidebarItemSubtitleBase}></span>
        </button>
      )}

      {dbHasTweets && (
        <button
          type="button"
          style={{
            ...buttonBaseStyle,
            color: "#721c24",
          }}
          onClick={() => {
            const message =
              "Close the archive? You will have to fetch or upload these tweets again.";
            if (confirm(message)) clearDatabase();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f8d7da";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span
            style={{
              ...sidebarItemTitleBase,
              color: "#721c24",
            }}
          >
            Close Archive
          </span>
          <span style={sidebarItemSubtitleBase}></span>
        </button>
      )}
    </div>
  );
};
