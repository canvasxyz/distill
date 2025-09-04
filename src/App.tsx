import { Outlet } from "react-router";
import "./App.css";
import { Sidebar } from "./Sidebar";

function App() {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <Sidebar />

      <div style={{ flexGrow: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default App;
