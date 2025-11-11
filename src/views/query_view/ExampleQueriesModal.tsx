import { useMemo } from "react";
import { replaceAccountName } from "./ai_utils";
import {
  Heading,
  Flex,
  Box,
  IconButton,
  Text,
  Button,
  Dialog,
} from "@radix-ui/themes";

export function ExampleQueriesModal({
  isOpen,
  onClose,
  queries,
  onSelectQuery,
  username,
}: {
  isOpen: boolean;
  onClose: () => void;
  queries: string[];
  onSelectQuery?: (query: string) => void;
  username?: string | null;
}) {
  const safeUsername = useMemo(() => username || "", [username]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content
        style={{ width: "90%", maxWidth: 768, maxHeight: "80vh" }}
      >
        <Flex direction="column" gap="4" style={{ height: "100%" }}>
          <Flex justify="between" align="center" mb="2">
            <Dialog.Title>
              <Heading size="5">Example Questions</Heading>
            </Dialog.Title>
            <Dialog.Close>
              <IconButton variant="ghost" size="2" aria-label="Close modal">
                &times;
              </IconButton>
            </Dialog.Close>
          </Flex>
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              maxHeight: "54vh",
              overflowY: "auto",
            }}
          >
            <Box style={{ padding: 0, margin: 0, listStyle: "none" }}>
              {queries.map((query, idx) => {
                const queryWithAccountName = replaceAccountName(
                  query,
                  safeUsername,
                );
                return (
                  <Box
                    key={idx}
                    style={{
                      padding: "10px 0",
                      borderBottom:
                        idx !== queries.length - 1
                          ? "1px solid var(--gray-6)"
                          : undefined,
                    }}
                  >
                    <Flex align="center" justify="between" gap="3">
                      <Text size="3" style={{ flex: "1 1 auto" }}>
                        {queryWithAccountName}
                      </Text>
                      {onSelectQuery && (
                        <Button
                          size="2"
                          color="blue"
                          onClick={() => onSelectQuery(queryWithAccountName)}
                        >
                          Select
                        </Button>
                      )}
                    </Flex>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
