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

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="flex-1 text-2xl font-semibold text-slate-900">
            Example Questions
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-1 text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            &times;
          </button>
        </div>
        <div className="max-h-[54vh] overflow-y-auto pr-1">
          <ul className="divide-y divide-slate-200">
            {queries.map((query, idx) => {
              const queryWithAccountName = replaceAccountName(
                query,
                account?.username || "",
              );
              return (
                <li
                  key={idx}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <span className="flex-1 text-sm text-slate-700">
                    {queryWithAccountName}
                  </span>
                  {onSelectQuery && (
                    <button
                      type="button"
                      className="min-w-[90px] rounded-md border border-indigo-500 bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
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
