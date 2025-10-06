import { Outlet } from "react-router";
import "./App.css";
import { Sidebar } from "./Sidebar";
import { useEffect } from "react";
import { useStore } from "./store";

function App() {
  const { init } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default App;
