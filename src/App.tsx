import { Outlet } from "react-router";
import "./App.css";
import { Sidebar } from "./Sidebar";
import { useEffect } from "react";
import { useStore } from "./store";

function App() {
  const { init, subscribe, unsubscribe } = useStore();

  useEffect(() => {
    init();
    subscribe();

    return () => unsubscribe();
  }, [init, subscribe, unsubscribe]);

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
