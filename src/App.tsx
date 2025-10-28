import { Outlet } from "react-router";
import "./App.css";
import { useEffect } from "react";
import { useStore } from "./state/store";

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
    <div style={{ display: "flex" }}>
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default App;
