import { useEffect, useMemo, useState } from "react";

import { type QueryResult } from "./ai_utils";

export function BatchTweetsModal({
  queryResult,
  isOpen,
  onClose,
}: {
  queryResult: QueryResult | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const batchTweets = useMemo(() => {
    if (!queryResult) return [];
    return Object.values(queryResult.batchStatuses)
      .filter((batchStatus) => batchStatus.status === "done")
      .flatMap((batchStatus) => batchStatus.groundedTweetTexts.genuine)
      .map((tweetText) => ({ full_text: tweetText }));
  }, [queryResult]);

  const batchHallucinations = useMemo(() => {
    if (!queryResult) return [];
    return Object.values(queryResult.batchStatuses)
      .filter((batchStatus) => batchStatus.status === "done")
      .flatMap((batchStatus) => batchStatus.groundedTweetTexts.hallucinated)
      .map((tweetText) => ({ full_text: tweetText }));
  }, [queryResult]);

  const tabs = [
    { label: "Evidence", key: "evidence", count: batchTweets.length },
    {
      label: "Possible Hallucinations",
      key: "hallucinations",
      count: batchHallucinations.length,
    },
  ] as const;

  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>(
    tabs[0].key,
  );

  if (!isOpen) return null;

  const activeList =
    activeTab === "evidence" ? batchTweets : batchHallucinations;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="flex-1 text-2xl font-semibold text-slate-900">
            Evidence
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

        <div className="space-y-3 text-sm text-slate-700">
          <p>
            To generate the query result, Twitter Archive Explorer first extracts
            the most relevant tweets from the user's archive using a large
            language model. The retrieved tweets are then checked against the
            archive itself for "hallucinations". Only tweets that are actually
            present in the archive are used to generate the final result.
          </p>
          <p>
            Model: {queryResult?.model} on {queryResult?.provider}
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-t-md border-b-4 px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
                  isActive
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                    : "border-transparent text-slate-600 hover:text-indigo-500"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div className="mt-3 max-h-[54vh] overflow-y-auto pr-1">
          <ul className="divide-y divide-slate-200">
            {activeList.map((tweet, idx) => (
              <li key={idx} className="py-3">
                <span className="block text-sm text-slate-700">
                  {tweet.full_text}
                </span>
              </li>
            ))}
            {activeList.length === 0 && (
              <li className="py-6 text-center text-sm text-slate-500">
                No tweets found in this category.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
