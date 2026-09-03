import { Outlet, useLocation } from "react-router";
import "./App.css";
import { useEffect } from "react";
import { useStore } from "./state/store";
import { ResponsiveSidebar } from "./components/ResponsiveSidebar";
import { ArchiveNav } from "./components/ArchiveNav";
import { SelectedAccountProvider } from "./components/SelectedAccountProvider";

function App() {
  const { init, subscribe, unsubscribe } = useStore();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    init();
    subscribe();

    return () => {
      unsubscribe();
    };
  }, [init, subscribe, unsubscribe]);

  return (
    <SelectedAccountProvider>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <ArchiveNav />
      <div className="app-shell">
        <ResponsiveSidebar />
        <main id="main-content" className="app-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </SelectedAccountProvider>
  );
}

export default App;
