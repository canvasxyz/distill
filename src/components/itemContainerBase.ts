import type { CSSProperties } from "react";

// Shared styles for sidebar items
export const itemContainerBase: CSSProperties = {
  cursor: "pointer",
  padding: "10px 18px 6px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  transition: "background 0.12s",
};

export const itemTitleBase: CSSProperties = {
  wordBreak: "break-word",
};
