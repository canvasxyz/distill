import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@radix-ui/themes/styles.css";
import "./index.css";
import App from "./App.tsx";
import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { MyArchiveView } from "./views/MyArchiveView.tsx";
import { AllTweetsView } from "./views/AllTweetsView.tsx";
import { Theme } from "@radix-ui/themes";

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
    <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
      <RouterProvider router={router} />
    </Theme>
  </StrictMode>,
);
