import { useLiveQuery } from "dexie-react-hooks";
import { useStore } from "../../store";
import { db } from "../../db";

export function PastQueries() {
  const { account } = useStore();

  const pastQueries = useLiveQuery(() => db.queryResults.toArray());

  if (!account) return <></>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        paddingBottom: "20px",
      }}
    >
      {(pastQueries || []).map((query) => (
        <div key={query.id}>
          {query.id} - {query.query}
        </div>
      ))}
    </div>
  );
}
