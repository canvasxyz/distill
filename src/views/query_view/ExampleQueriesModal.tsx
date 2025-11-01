import { useEffect } from "react";
import { replaceAccountName } from "./ai_utils";
import { useStore } from "../../state/store";

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
  // Prevent scroll on the underlying page when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-[1000] left-0 top-0 w-screen h-screen bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-[90%] max-w-[768px] max-h-[80vh] bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.18)] p-[32px_24px_24px_24px] relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-[18px]">
          <h2 className="m-0 text-[22px] flex-1">
            Example Questions
          </h2>
          <button
            className="border-none bg-transparent text-[22px] cursor-pointer text-gray-600 font-bold ml-3 self-start"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 min-h-0 max-h-[54vh] overflow-y-auto">
          <ul className="p-0 m-0 list-none">
            {queries.map((query, idx) => {
              const queryWithAccountName = replaceAccountName(
                query,
                account?.username || "",
              );
              return (
                <li
                  key={idx}
                  className={`py-[10px] ${
                    idx !== queries.length - 1 ? "border-b border-gray-100" : ""
                  } flex items-center justify-between`}
                >
                  <span className="mr-[10px] flex-[1_1_auto] text-[15px]">
                    {queryWithAccountName}
                  </span>
                  {onSelectQuery && (
                    <button
                      className="py-[6px] px-[14px] text-sm rounded border border-blue-500 bg-blue-500 text-white cursor-pointer min-w-[90px] box-border"
                      onClick={() => onSelectQuery(queryWithAccountName)}
                    >
                      Select
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
