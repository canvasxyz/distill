import { replaceAccountName } from "./ai_utils";
import { useStore } from "../../state/store";
import { Dialog, Button } from "@radix-ui/themes";

export function ExampleQueriesModal({
  isOpen,
  onClose,
  queries,
  onSelectQuery,
}: {
  isOpen: boolean;
  onClose: () => void;
  queries: string[];
  onSelectQuery?: (query: string) => void;
}) {
  const { account } = useStore();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content style={{ maxWidth: 768 }}>
        <Dialog.Title>Example Questions</Dialog.Title>
        <div
          style={{
            maxHeight: "54vh",
            overflowY: "auto",
          }}
        >
          <ul
            style={{
              padding: 0,
              margin: 0,
              listStyle: "none",
            }}
          >
            {queries.map((query, idx) => {
              const queryWithAccountName = replaceAccountName(
                query,
                account?.username || "",
              );
              return (
                <li
                  key={idx}
                  style={{
                    padding: "10px 0",
                    borderBottom:
                      idx !== queries.length - 1 ? "1px solid #eee" : undefined,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{ marginRight: 10, flex: "1 1 auto", fontSize: 15 }}
                  >
                    {queryWithAccountName}
                  </span>
                  {onSelectQuery && (
                    <Button
                      onClick={() => onSelectQuery(queryWithAccountName)}
                    >
                      Select
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
