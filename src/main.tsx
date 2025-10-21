import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { MyArchiveView } from "./views/MyArchiveView.tsx";
import { IncludedTweetsView } from "./views/IncludedTweetsView.tsx";
import { ExcludedTweetsView } from "./views/ExcludedTweetsView.tsx";
import { FilteredTweetsView } from "./views/FilteredTweetsView.tsx";
import { AllTweetsView } from "./views/AllTweetsView.tsx";
import { EchoProvider } from "@merit-systems/echo-react-sdk";

const echoAppId = import.meta.env.VITE_ECHO_APP_ID;
if (!echoAppId) {
  throw new Error("VITE_ECHO_APP_ID is not set in environment variables");
}

const router = createHashRouter([
  {
    path: "/",
    Component: App,
    children: [
      { index: true, Component: MyArchiveView },
      { path: "all-tweets", Component: AllTweetsView },
      { path: "included-tweets", Component: IncludedTweetsView },
      { path: "excluded-tweets", Component: ExcludedTweetsView },
      { path: "filters/:filter", Component: FilteredTweetsView },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EchoProvider config={{ appId: echoAppId }}>
      <RouterProvider router={router} />
    </EchoProvider>
  </StrictMode>
);
