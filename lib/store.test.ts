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
  it("INGEST_START enters the running phase and records the source", () => {
    const state = ingoReducer(initialState, {
      type: "INGEST_START",
      sourceName: "sample.txt",
    });
    expect(state).toMatchObject({ phase: "running", sourceName: "sample.txt", error: null });
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
      sourceName: "sample.txt",
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
});
