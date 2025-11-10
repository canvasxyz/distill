import { Outlet } from "react-router";
import "./App.css";
import { useEffect } from "react";
import { useStore } from "./state/store";
import { PastQueries } from "./views/query_view/SidebarQueries";
import { useNavigate } from "react-router";
import { Box, Flex, Link } from "@radix-ui/themes";

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
    <Flex style={{ height: "100vh", overflowY: "scroll" }}>
      <Box
        style={{
          minWidth: 220,
          maxWidth: 220,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          borderRight: "1px solid var(--gray-6)",
        }}
      >
        <Flex direction="column" style={{ height: "100%" }}>
          <Box p="4" pb="3">
            <Link
              onClick={() => navigate("/")}
              style={{
                cursor: "pointer",
                fontSize: 32,
                textDecoration: "none",
              }}
            >
              💧
            </Link>
          </Box>
          <Box style={{ flex: 1 }}>
            <PastQueries />
          </Box>
        </Flex>
      </Box>
      <Box style={{ flex: 1 }}>
        <Outlet />
      </Box>
    </Flex>
  );
}

export default App;
