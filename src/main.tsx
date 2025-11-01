import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import App from "./App.tsx";
import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { MyArchiveView } from "./views/MyArchiveView.tsx";
import { AllTweetsView } from "./views/AllTweetsView.tsx";

const router = createHashRouter([
  {
    path: "/",
    Component: App,
    children: [
      { index: true, Component: MyArchiveView },
      { path: "all-tweets", Component: AllTweetsView },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme
      appearance="light"
      accentColor="indigo"
      grayColor="slate"
      radius="medium"
      scaling="95%"
    >
      <RouterProvider router={router} />
    </Theme>
  </StrictMode>,
);
