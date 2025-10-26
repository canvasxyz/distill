import { Outlet } from "react-router";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { useEffect } from "react";
import { useStore } from "./state/store";

function App() {
  const { init, subscribe, unsubscribe, analysisQueue } = useStore();

  useEffect(() => {
    init();
    subscribe();

    return () => {
      unsubscribe();
      // clear any in-progress jobs if the page hot reloads
      analysisQueue.clear();
    };
  }, [init, subscribe, unsubscribe, analysisQueue]);

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
