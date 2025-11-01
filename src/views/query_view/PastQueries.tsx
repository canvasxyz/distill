import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useStore } from "../../state/store";
import type { QueryResult, RangeSelection } from "./ai_utils";
import { CopyButton } from "./ResultsBox";
import { stripThink } from "../../utils";
import { BatchTweetsModal } from "./BatchTweetsModal";

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";

  const datePart = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const timePart = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart} ${timePart}`;
}

function formatRangeSelection(rangeSelection?: RangeSelection) {
  if (!rangeSelection) return "latest tweets";

  if (rangeSelection.type === "date-range") {
    const start = formatDateTime(rangeSelection.startDate);
    const end = formatDateTime(rangeSelection.endDate);
    return `${start} - ${end}`;
  }

  return `latest ${rangeSelection.numTweets} tweets`;
}

function PastQueryItem({ query }: { query: QueryResult }) {
  const [open, setOpen] = useState(false);
  const [showBatchTweetsModal, setShowBatchTweetsModal] = useState(false);

  const containerClasses = open
    ? "overflow-hidden rounded-md border border-slate-200 bg-white shadow-md"
    : "overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm";

  return (
    <div className={containerClasses}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left font-medium text-slate-800 transition hover:bg-slate-50"
      >
        <span className="flex-1 break-words">
          {query.query.length > 120
            ? `${query.query.slice(0, 120)}?`
            : query.query}
        </span>
        <span className="ml-auto pl-2 text-xs font-normal text-slate-500">
          {formatRangeSelection(query.rangeSelection)}
        </span>
        <span className="min-w-[90px] flex-shrink-0 pl-3 text-right text-[11px] font-normal text-slate-400">
          {formatDateTime(query.id)}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-200 bg-slate-50 px-5 py-5">
          <div className="flex flex-col gap-3 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                onClick={() => setShowBatchTweetsModal(true)}
              >
                Evidence
              </button>
              <CopyButton text={query.result} />
            </div>
            <div className="prose prose-sm prose-slate max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>
                {stripThink(query.result)}
              </Markdown>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-slate-600">
            <span>
              <span className="font-semibold text-emerald-500">
                Total Run Time:
              </span>{" "}
              {(query.totalRunTime / 1000).toFixed(2)}s
            </span>
            <span>
              <span className="font-semibold text-amber-500">Range:</span>{" "}
              {formatRangeSelection(query.rangeSelection)}
            </span>
            <span>
              <span className="font-semibold text-indigo-500">Provider:</span>{" "}
              {query.provider}
            </span>
            <span>
              <span className="font-semibold text-rose-500">Model:</span>{" "}
              {query.model}
            </span>
            <span>
              <span className="font-semibold text-rose-500">Tokens:</span>{" "}
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

  if (!account) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-3 py-5">
      {(queryResults || []).map((query) => (
        <PastQueryItem key={query.id} query={query} />
      ))}
    </div>
  );
}
