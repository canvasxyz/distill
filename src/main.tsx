import "@radix-ui/themes/styles.css";
import "@fontsource-variable/fraunces/full.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { MyArchiveView } from "./views/MyArchiveView.tsx";
import { AllTweetsView } from "./views/AllTweetsView.tsx";
import { PastQueryDetailView } from "./views/query_view/PastQueryDetailView.tsx";
import Chat from "./views/chat/Chat.tsx";
import { NotFound } from "./views/NotFound.tsx";
import { Settings } from "./views/Settings.tsx";
import { AvatarView } from "./views/avatar_view/AvatarView.tsx";
import { ThemeProvider } from "./components/ThemeProvider";
import { About } from "./views/About";
import { HistoryView } from "./views/query_view/HistoryView";

const router = createHashRouter([
  {
    path: "/",
    Component: App,
    children: [
      { index: true, Component: MyArchiveView },
      { path: "all-tweets", Component: AllTweetsView },
      { path: "chat", Component: Chat },
      { path: "settings", Component: Settings },
      { path: "avatar", Component: AvatarView },
      { path: "about", Component: About },
      { path: "history", Component: HistoryView },
      { path: "query/:queryId", Component: PastQueryDetailView },
      { path: "*", Component: NotFound },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
