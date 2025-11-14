import { Outlet } from "react-router";
import "./App.css";
import { useEffect } from "react";
import { useStore } from "./state/store";
import { Box, Flex } from "@radix-ui/themes";
import { ResponsiveSidebar } from "./components/ResponsiveSidebar";

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
    <Flex style={{ height: "100vh", overflowY: "scroll" }}>
      <ResponsiveSidebar />
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Flex>
  );
}

export default App;
