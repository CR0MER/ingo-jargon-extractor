import { describe, expect, it } from "vitest";
import { ingoReducer, initialState } from "./store";
import type { Term } from "./types";

const sampleTerms: Term[] = [
  {
    term: "猫",
    pos: "NOUN",
    ngram: 1,
    isEntity: false,
    isSlang: false,
    count: 2,
    corpusRank: 1509,
    score: 125.75,
    definition: "cat",
  },
];

describe("ingoReducer ingest lifecycle", () => {
  it("INGEST_START enters the running phase and records the sources", () => {
    const state = ingoReducer(initialState, {
      type: "INGEST_START",
      sourceNames: ["ep01.srt", "ep02.srt"],
    });
    expect(state).toMatchObject({
      phase: "running",
      sourceNames: ["ep01.srt", "ep02.srt"],
      error: null,
    });
  });

  it("INGEST_SUCCESS stores the real terms and resets pagination/ignored", () => {
    const dirty = { ...initialState, page: 3, ignored: ["stale"] };
    const state = ingoReducer(dirty, { type: "INGEST_SUCCESS", terms: sampleTerms });
    expect(state.phase).toBe("results");
    expect(state.terms).toBe(sampleTerms);
    expect(state.page).toBe(1);
    expect(state.ignored).toEqual([]);
  });

  it("INGEST_ERROR enters the error phase with a message", () => {
    const running = ingoReducer(initialState, {
      type: "INGEST_START",
      sourceNames: ["sample.txt"],
    });
    const state = ingoReducer(running, {
      type: "INGEST_ERROR",
      message: "Couldn't reach the ingest service.",
    });
    expect(state).toMatchObject({
      phase: "error",
      error: "Couldn't reach the ingest service.",
    });
  });

  it("RETRY returns to the empty phase and clears the error", () => {
    const errored = ingoReducer(initialState, {
      type: "INGEST_ERROR",
      message: "boom",
    });
    const state = ingoReducer(errored, { type: "RETRY" });
    expect(state).toMatchObject({ phase: "empty", error: null });
  });

  it("RESET clears the file batch, results, and result-scoped view state, but leaves tuning settings alone", () => {
    const dirty = {
      ...initialState,
      phase: "results" as const,
      sourceNames: ["ep01.srt", "ep02.srt"],
      terms: sampleTerms,
      page: 3,
      ignored: ["stale"],
      search: "猫",
      sortKey: "count" as const,
      sortDir: 1 as const,
      // Tuning settings should survive a reset.
      cutoffLo: 5000,
      noKatakana: true,
    };

    const state = ingoReducer(dirty, { type: "RESET" });

    expect(state).toMatchObject({
      phase: "empty",
      sourceNames: [],
      terms: [],
      error: null,
      page: 1,
      ignored: [],
      search: "",
      sortKey: "score",
      sortDir: -1,
      cutoffLo: 5000,
      noKatakana: true,
    });
  });
});
