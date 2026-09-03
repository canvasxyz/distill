import { Box } from "@radix-ui/themes";
import type { ReactNode } from "react";

export function PageContent({ children }: { children: ReactNode }) {
  return <Box className="page-content">{children}</Box>;
}
