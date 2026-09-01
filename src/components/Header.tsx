import { Heading } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface HeaderProps {
  leftContent?: ReactNode;
  title?: string;
  rightContent?: ReactNode;
  height?: string;
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between";
  reserveFloatingNavSpace?: boolean;
}

export function Header({
  leftContent,
  title,
  rightContent,
  height = "52px",
  justifyContent = "space-between",
  reserveFloatingNavSpace = true,
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
      className={reserveFloatingNavSpace ? "view-header" : undefined}
    >
      <div style={{ flexShrink: 0, minWidth: 0 }}>
        {title ? (
          <Heading as="h1" size="4" weight="medium" m="0">
            {title}
          </Heading>
        ) : (
          leftContent
        )}
      </div>
      {rightContent && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {rightContent}
        </div>
      )}
    </header>
  );
}
