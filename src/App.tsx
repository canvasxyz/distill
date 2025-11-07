import { Outlet } from "react-router";
import "./App.css";
import { useEffect } from "react";
import { useStore } from "./state/store";
import { PastQueries } from "./views/query_view/SidebarQueries";
import { useNavigate } from "react-router";

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
    <div style={{ height: "100vh", overflowY: "scroll", display: "flex" }}>
      <div
        style={{
          minWidth: 220,
          maxWidth: 220,
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div style={{ margin: "15px 20px", fontSize: 32 }}>
          <a
            type="link"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            🔎
          </a>
        </div>
        <div style={{ flex: 1 }}>
          <PastQueries />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default App;
