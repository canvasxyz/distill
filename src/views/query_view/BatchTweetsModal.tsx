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
  // Prevent scroll on the underlying page when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const batchTweets = useMemo(() => {
    if (!queryResult) return [];
    return Object.values(queryResult?.batchStatuses)
      .filter((batchStatus) => batchStatus.status === "done")
      .map((batchStatus) => batchStatus.groundedTweetTexts.genuine)
      .flat()
      .map((tweetText) => ({ full_text: tweetText }));
  }, [queryResult]);

  const batchHallucinations = useMemo(() => {
    if (!queryResult) return [];
    return Object.values(queryResult?.batchStatuses)
      .filter((batchStatus) => batchStatus.status === "done")
      .map((batchStatus) => batchStatus.groundedTweetTexts.hallucinated)
      .flat()
      .map((tweetText) => ({ full_text: tweetText }));
  }, [queryResult]);

  const TABS = [
    { label: "Evidence", key: "evidence", count: batchTweets.length },
    {
      label: "Possible Hallucinations",
      key: "hallucinations",
      count: batchHallucinations.length,
    },
  ];
  const [activeTab, setActiveTab] = useState(TABS[0].key);

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
        <div className="flex items-center justify-between pb-3">
          <h2 className="m-0 text-[22px] flex-1">Evidence</h2>

          <button
            className="border-none bg-transparent text-[22px] cursor-pointer text-gray-600 font-bold ml-3 self-start"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
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

        <div className="flex mt-4 gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`${
                activeTab === tab.key
                  ? "bg-gray-100 border-b-[3px] border-b-blue-500 text-blue-500 font-bold"
                  : "bg-transparent border-b-[3px] border-b-transparent text-gray-800 font-normal"
              } border-none p-[12px_20px] cursor-pointer outline-none text-base transition-[color,border-bottom,background] duration-200 rounded-t-md`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        {activeTab === "evidence" ? (
          <div className="flex-1 min-h-0 max-h-[54vh] overflow-y-auto">
            <ul className="p-0 m-0 list-none">
              {batchTweets.map((batchTweet, idx) => {
                return (
                  <li
                    key={idx}
                    className={`py-[10px] ${
                      idx !== batchTweets.length - 1 ? "border-b border-gray-100" : ""
                    } flex items-center justify-between`}
                  >
                    <span className="mr-[10px] flex-[1_1_auto] text-[15px]">
                      {batchTweet.full_text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 max-h-[54vh] overflow-y-auto">
              <ul className="p-0 m-0 list-none">
                {batchHallucinations.map((batchTweet, idx) => {
                  return (
                    <li
                      key={idx}
                      className={`py-[10px] ${
                        idx !== batchTweets.length - 1 ? "border-b border-gray-100" : ""
                      } flex items-center justify-between`}
                    >
                      <span className="mr-[10px] flex-[1_1_auto] text-[15px]">
                        {batchTweet.full_text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
