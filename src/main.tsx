import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { MyArchiveView } from "./views/MyArchiveView.tsx";
import { AllTweetsView } from "./views/AllTweetsView.tsx";
import { PastQueryDetailView } from "./views/query_view/PastQueryDetailView.tsx";
import Chat from "./views/Chat.tsx";

const router = createHashRouter([
  {
    path: "/",
    Component: App,
    children: [
      { index: true, Component: MyArchiveView },
      { path: "all-tweets", Component: AllTweetsView },
      { path: "chat", Component: Chat },
      { path: "query/:queryId", Component: PastQueryDetailView },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme>
      <RouterProvider router={router} />
    </Theme>
  </StrictMode>,
);
