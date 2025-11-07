import { Navigate } from "react-router";
import { useStore } from "../state/store";
import type { ReactNode } from "react";

export const ShowIfTweetsLoaded = ({ children }: { children: ReactNode }) => {
  const { appIsReady, dbHasTweets } = useStore();

  if (appIsReady && !dbHasTweets) {
    return <Navigate to="/" />;
  }

  return children;
};
