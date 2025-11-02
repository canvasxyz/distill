import type { CSSProperties } from "react";

export const sidebarItemContainerBase: CSSProperties = {
  cursor: "pointer",
  padding: "10px 18px 6px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  transition: "background 0.12s",
};

export const sidebarItemTitleBase: CSSProperties = {
  fontSize: "13px",
  wordBreak: "break-word",
};

export const sidebarItemSubtitleBase: CSSProperties = {
  color: "#888",
  fontSize: "11px",
  fontWeight: 400,
};
