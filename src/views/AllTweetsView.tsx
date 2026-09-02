import { usePagination } from "../hooks/usePagination";
import { TweetsView } from "./TweetsView";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";
import { useStore } from "../state/store";
import { useFilterBySearchParam } from "../hooks/useFilterBySearchParam";
import { useSearchParams } from "react-router";
import { Header } from "../components/Header";
import { Box } from "@radix-ui/themes";
import { useMemo } from "react";

const getTweetTimestamp = (createdAt: string) => {
  const timestamp = new Date(createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

function AllTweetsViewInner() {
  const { allTweets } = useStore();

  const [params] = useSearchParams();
  const searchParam = params.get("search");
  const accountIdParam = params.get("account_id");

  const searchedTweets = useFilterBySearchParam(searchParam, allTweets);
  const filteredTweets = useMemo(
    () =>
      searchedTweets
        .filter((tweet) =>
          accountIdParam ? tweet.account_id === accountIdParam : true,
        )
        .sort(
          (a, b) =>
            getTweetTimestamp(b.created_at) - getTweetTimestamp(a.created_at),
        ),
    [accountIdParam, searchedTweets],
  );

  const { itemsToDisplay, navigateNext, navigatePrevious } = usePagination({
    items: filteredTweets,
    limit: 20,
  });

  return (
    <TweetsView
      searchParam={searchParam}
      title="All Tweets"
      allTweets={filteredTweets}
      tweetsToDisplay={itemsToDisplay!}
      navigateNext={navigateNext}
      navigatePrevious={navigatePrevious}
    />
  );
}

export function AllTweetsView() {
  return (
    <Box style={{ width: "100%", overflowX: "hidden" }}>
      <ShowIfTweetsLoaded>
        <Header title="All Tweets" />
        <AllTweetsViewInner />
      </ShowIfTweetsLoaded>
    </Box>
  );
}
