import { useNavigate } from "react-router";
import { Button, Flex } from "@radix-ui/themes";
import { useStore } from "../state/store";

export const SidebarActions = () => {
  const navigate = useNavigate();
  const { clearDatabase } = useStore();

  return (
    <Flex direction="column" gap="3">
      <Button
        variant="soft"
        color="indigo"
        size="3"
        onClick={() => {
          navigate("/all-tweets");
        }}
      >
        View Tweets
      </Button>

      <Button
        variant="outline"
        color="red"
        size="3"
        onClick={() => {
          const message =
            "Close the archive? You will have to fetch or upload these tweets again.";
          if (confirm(message)) clearDatabase();
        }}
      >
        Close Archive
      </Button>
    </Flex>
  );
};
