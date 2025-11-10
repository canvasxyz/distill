import type { ReactNode } from "react";
import { Card, Flex } from "@radix-ui/themes";

export const FeaturedQueryCard = ({
  children,
  isProcessing,
}: {
  children: ReactNode;
  isProcessing: boolean;
}) => (
  <Card
    style={{
      minHeight: "140px",
      opacity: isProcessing ? 0.6 : 1,
    }}
  >
    <Flex
      direction="column"
      align="center"
      justify="between"
      gap="3"
      style={{ textAlign: "center", height: "100%" }}
    >
      {children}
    </Flex>
  </Card>
);
