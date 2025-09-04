import { Outlet } from "react-router";
import "./App.css";
import { Sidebar } from "./Sidebar";

function App() {
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
