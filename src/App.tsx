import { Outlet } from "react-router";
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
    <div className="flex h-screen overflow-y-auto bg-slate-50">
      <div className="flex min-w-[220px] flex-col border-r border-slate-200 bg-white shadow-sm">
        <div className="mt-4 flex items-center justify-center px-5 text-4xl">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="cursor-pointer text-4xl transition hover:scale-105"
          >
            🔎
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <PastQueries />
        </div>
        <ArchiveSummarySection />
        <SidebarActions />
      </div>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
