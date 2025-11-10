import type { Account } from "../types";
import { Button } from "@radix-ui/themes";

export const ViewTweetsButton = ({ account }: { account: Account }) => (
  <Button
    type="button"
    onClick={() => {
      window.open(`#/all-tweets/?account_id=${account.accountId}`, "_blank");
    }}
    variant="soft"
    color="blue"
    size="2"
    style={{ marginLeft: 8 }}
    title="View tweets for this user"
  >
    View tweets
  </Button>
);
