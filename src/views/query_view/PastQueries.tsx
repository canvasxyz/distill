import { useStore } from "../../state/store";

import { useState } from "react";
import type { QueryResult, RangeSelection } from "./ai_utils";
import { CopyButton } from "./ResultsBox";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { stripThink } from "../../utils";
import { BatchTweetsModal } from "./BatchTweetsModal";

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "";
  // dateStr could be an ISO datetime or undefined
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return (
    d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    " " +
    d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function formatRangeSelection(rangeSelection?: RangeSelection) {
  if (!rangeSelection) return "latest tweets";
  return rangeSelection.type === "date-range"
    ? `${formatDateTime(rangeSelection.startDate)} - ${formatDateTime(
        rangeSelection.endDate,
      )}`
    : `latest ${rangeSelection.numTweets} tweets`;
}

function PastQueryItem({ query }: { query: QueryResult }) {
  const [open, setOpen] = useState(false);
  const [showBatchTweetsModal, setShowBatchTweetsModal] = useState(false);

  return (
    <div
      className={`border border-gray-300 rounded-md bg-white overflow-hidden ${
        open ? "shadow-[0px_2px_10px_#eee]" : ""
      }`}
    >
      <div
        onClick={() => setOpen((open) => !open)}
        className="cursor-pointer p-[10px_18px] flex flex-row items-center gap-3 font-medium transition-colors duration-[120ms] hover:bg-[#f7faff]"
      >
        <span className="flex-grow break-words">
          {query.query.length > 120
            ? query.query.slice(0, 120) + "…"
            : query.query}
        </span>
        <span className="text-gray-500 text-xs font-normal pl-[10px] ml-auto">
          {formatRangeSelection(query.rangeSelection)}
        </span>
        <span className="text-gray-400 text-[11px] font-normal pl-3 flex-shrink-0 min-w-[90px] text-right">
          {formatDateTime(query.id)}
        </span>
      </div>
      {open && (
        <div className="p-5">
          <div className="font-[inherit] text-[15px] text-[#0c254d] rounded border border-gray-600 p-[10px_12px] relative mb-1 min-h-8 flex flex-col">
            <div className="flex flex-row">
              <div className="flex-1" />
              <div className="flex flex-row gap-[10px] justify-end">
                <button
                  className="border border-[rgb(150,234,153)] rounded py-1 px-2 bg-white text-[#388e3c] text-xs font-bold cursor-pointer transition-all duration-200 hover:bg-[#e7f6e7]"
                  onClick={() => {
                    setShowBatchTweetsModal(true);
                  }}
                >
                  Evidence
                </button>
                <CopyButton text={query.result} />
              </div>
            </div>
            <Markdown remarkPlugins={[remarkGfm]}>
              {stripThink(query.result)}
            </Markdown>
          </div>
          <div className="mt-4 text-[13px] text-gray-500 flex gap-5 flex-wrap">
            <span>
              <span className="text-[#62b47a] font-medium">
                Total Run Time:
              </span>{" "}
              {(query.totalRunTime / 1000).toFixed(2)}s
            </span>
            <span>
              <span className="text-[#baac4e] font-medium">Range:</span>{" "}
              {formatRangeSelection(query.rangeSelection)}
            </span>
            <span>
              <span className="text-[#4e52ba] font-medium">
                Provider:
              </span>{" "}
              {query.provider}
            </span>
            <span>
              <span className="text-[#bf4962] font-medium">Model:</span>{" "}
              {query.model}
            </span>
            <span>
              <span className="text-[#bf4962] font-medium">Tokens:</span>{" "}
              {query.totalTokens}
            </span>
          </div>
        </div>
      )}
      <BatchTweetsModal
        isOpen={showBatchTweetsModal}
        queryResult={query}
        onClose={() => setShowBatchTweetsModal(false)}
      />
    </div>
  );
}

export function PastQueries() {
  const { account, queryResults } = useStore();

  if (!account) return <></>;

  return (
    <div className="flex flex-col gap-[10px] pb-5 pt-5">
      {(queryResults || []).map((query) => (
        <PastQueryItem query={query} />
      ))}
    </div>
  );
}
