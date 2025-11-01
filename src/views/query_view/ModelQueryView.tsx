import { RunQueries } from "./RunQueries";

export function ModelQuerySection() {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        marginBottom: "40px",
      }}
    >
      <RunQueries />
    </section>
  );
}
