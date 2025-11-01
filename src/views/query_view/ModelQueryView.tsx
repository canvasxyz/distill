import { useState } from "react";
import { ShowIfTweetsLoaded } from "../ShowIfTweetsLoaded";
import { RunQueries } from "./RunQueries";
import { PastQueries } from "./PastQueries";

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
