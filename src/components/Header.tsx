import { ReactNode } from "react";

interface HeaderProps {
  leftContent: ReactNode;
  rightContent?: ReactNode;
  height?: string;
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between";
}

export function Header({
  leftContent,
  rightContent,
  height = "52px",
  justifyContent = "space-between",
}: HeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent,
        padding: "0 16px",
        width: "100%",
        height,
        boxSizing: "border-box",
        minWidth: 0,
        maxWidth: "100%",
        flexShrink: 0,
      }}
    >
      <div style={{ flexShrink: 0 }}>{leftContent}</div>
      {rightContent && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {rightContent}
        </div>
      )}
    </header>
  );
}

