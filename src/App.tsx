import { useEffect } from "react";
import { Outlet } from "react-router";
import { useNavigate } from "react-router";
import "./App.css";
import { useStore } from "./state/store";
import { PastQueries } from "./views/query_view/PastQueries";
import { ArchiveSummarySection } from "./views/ArchiveSummarySection";
import { SidebarActions } from "./views/SidebarActions";
import {
  Box,
  Flex,
  IconButton,
  ScrollArea,
  Separator,
  Text,
} from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

function App() {
  const { init, subscribe, unsubscribe } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    init();
    subscribe();

    return () => {
      unsubscribe();
    };
  }, [init, subscribe, unsubscribe]);

  return (
    <Flex height="100vh" overflow="hidden">
      <Flex
        direction="column"
        width="240px"
        style={{
          borderRight: "1px solid var(--gray-a5)",
          backgroundColor: "var(--gray-2)",
        }}
      >
        <Box px="4" pt="4" pb="3">
          <IconButton
            variant="ghost"
            size="3"
            radius="large"
            onClick={() => navigate("/")}
            aria-label="Go to home"
          >
            <MagnifyingGlassIcon width="24" height="24" />
          </IconButton>
        </Box>
        <ScrollArea type="always" style={{ flex: 1 }}>
          <Box px="4" pb="4">
            <Text weight="medium" size="3" color="gray" mb="2">
              Past queries
            </Text>
            <PastQueries />
          </Box>
        </ScrollArea>
        <Separator size="4" />
        <Box px="4" py="4">
          <ArchiveSummarySection />
        </Box>
        <Separator size="4" />
        <Box px="4" py="4">
          <SidebarActions />
        </Box>
      </Flex>
      <Box flexGrow="1" style={{ overflowY: "auto" }}>
        <Outlet />
      </Box>
    </Flex>
  );
}

export default App;
