import { Navigate } from "react-router";
import { useStore } from "../state/store";

export const ShowIfTweetsLoaded = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { appIsReady, dbHasTweets } = useStore();

  if (appIsReady && !dbHasTweets) {
    return <Navigate to="/upload-tweets" />;
  }

  return children;
};
