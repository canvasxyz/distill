import { Box } from "@radix-ui/themes";
import type { ReactNode } from "react";

export function PageContent({ children }: { children: ReactNode }) {
  return (
    <Box
      style={{
        maxWidth: "800px",
        margin: "auto",
        width: "100%",
        boxSizing: "border-box",
        padding: "0 16px",
      }}
    >
      {children}
    </Box>
  );
}
