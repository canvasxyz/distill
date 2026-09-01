import { Outlet } from "react-router";
import "./App.css";
import { useEffect } from "react";
import { useStore } from "./state/store";
import { Box, Flex } from "@radix-ui/themes";
import { ResponsiveSidebar } from "./components/ResponsiveSidebar";
import { ArchiveNav } from "./components/ArchiveNav";

function App() {
  const { init, subscribe, unsubscribe } = useStore();

  useEffect(() => {
    init();
    subscribe();

    return () => {
      unsubscribe();
    };
  }, [init, subscribe, unsubscribe]);

  return (
    <>
      <Flex style={{ minHeight: "100vh", overflowX: "hidden", width: "100%" }}>
        <ResponsiveSidebar />
        <Box
          className="app-content"
          style={{
            flex: 1,
            minWidth: 0,
            height: "100vh",
            overflowY: "auto",
            overflowX: "hidden",
            maxWidth: "100%",
          }}
        >
          <ArchiveNav />
          <Outlet />
        </Box>
      </Flex>
    </>
  );
}

export default App;
