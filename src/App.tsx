import { Outlet } from "react-router";
import "./App.css";
import { useEffect } from "react";
import { useStore } from "./state/store";
import { PastQueries } from "./views/query_view/PastQueries";
import { ArchiveSummarySection } from "./views/ArchiveSummarySection";
import { SidebarActions } from "./views/SidebarActions";
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
    <div className="h-screen overflow-y-scroll flex">
      <div className="min-w-[220px] border-r border-gray-300 flex flex-col">
        <div className="m-[15px_20px] text-[32px]">
          <a
            type="link"
            onClick={() => navigate("/")}
            className="cursor-pointer"
          >
            🔎
          </a>
        </div>
        <div className="flex-1">
          <PastQueries />
        </div>
        <ArchiveSummarySection />
        <SidebarActions />
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
