import { useNavigate, useParams } from "react-router";
import { useStore } from "../../state/store";
import { useMemo, useState } from "react";
import { extractTimestampFromUUIDv7 } from "../../utils";
import {
  ResultsBox,
  QueryResultHeader,
  QueryResultActions,
} from "./ResultsBox";
import { SourceTweetsPanel } from "./SourceTweetsPanel";
import type { RangeSelection } from "./ai_utils";
import { db } from "../../db";
import { Button } from "@radix-ui/themes";
import { PageContent } from "../../components/PageContent";
import { QueryResultMarkdown } from "./QueryResultMarkdown";
import type { Tweet } from "../../types";

function formatDateTime(d: Date) {
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
    ? `${formatDateTime(new Date(rangeSelection.startDate))} - ${formatDateTime(
        new Date(rangeSelection.endDate),
      )}`
    : `latest ${rangeSelection.numTweets} tweets`;
}

export function PastQueryDetailView() {
  const { queryId } = useParams<{ queryId: string }>();
  const { queryResults, accounts, allTweets } = useStore();
  const navigate = useNavigate();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const query = queryResults?.find((q) => q.id === queryId);
  const accountIdToUsername = useMemo(
    () => new Map((accounts || []).map((a) => [a.accountId, a.username])),
    [accounts],
  );
  const tweetsById = useMemo(() => {
    const map = new Map<string, Tweet>();
    (allTweets || []).forEach((tweet) => {
      if (tweet.id) map.set(tweet.id, tweet);
      if (tweet.id_str) map.set(tweet.id_str, tweet);
    });
    return map;
  }, [allTweets]);

  if (!query) {
    return (
      <PageContent>
        <div className="empty-state">
          <h1>Question not found.</h1>
          <p>It may have been deleted or saved in a different browser.</p>
          <Button onClick={() => navigate("/history")}>
            Back to past questions
          </Button>
        </div>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <div className="past-question-toolbar">
        <Button onClick={() => navigate("/history")} variant="outline">
          ← Past questions
        </Button>
        <Button
          aria-label="Delete this question"
          variant="outline"
          color="red"
          onClick={async () => {
            if (
              !confirm(
                "Delete this question and its answer? This cannot be undone.",
              )
            )
              return;
            try {
              await db.queryResults.delete(query.id);
              navigate("/history");
            } catch {
              setDeleteError("Couldn’t delete this answer. Please try again.");
            }
          }}
        >
          Delete
        </Button>
      </div>
      {deleteError && (
        <p role="alert" className="archive-upload-error">
          {deleteError}
        </p>
      )}
      <ResultsBox>
        <QueryResultHeader result={query} showQuestion />
        <QueryResultMarkdown
          content={query.result}
          person={query.queriedHandle}
          tweetsById={tweetsById}
          accountIdToUsername={accountIdToUsername}
        />
        <QueryResultActions
          resultText={query.result}
          onShowEvidence={() => setSourcesOpen(!sourcesOpen)}
          sourcesOpen={sourcesOpen}
          sourcesId="saved-answer-sources"
        />
        {sourcesOpen && (
          <SourceTweetsPanel
            key={query.id}
            result={query}
            id="saved-answer-sources"
          />
        )}
      </ResultsBox>
      <details className="answer-details">
        <summary>Answer details</summary>
        <dl>
          <div>
            <dt>Time</dt>
            <dd>{(query.totalRunTime / 1000).toFixed(2)} seconds</dd>
          </div>
          <div>
            <dt>Post range</dt>
            <dd>{formatRangeSelection(query.rangeSelection)}</dd>
          </div>
          <div>
            <dt>Provider</dt>
            <dd>{query.provider}</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>{query.model}</dd>
          </div>
          <div>
            <dt>Tokens</dt>
            <dd>{query.totalTokens.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{formatDateTime(extractTimestampFromUUIDv7(query.id))}</dd>
          </div>
        </dl>
      </details>
    </PageContent>
  );
}
