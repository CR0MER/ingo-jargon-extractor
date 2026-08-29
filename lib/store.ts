import type { NgramLength, Pos, Term } from "./types";
import type { SortDir, SortKey } from "./filter";

export type Phase = "empty" | "running" | "results" | "error";
export type ModalKind = "export" | "ignored" | null;
export type ExportFormat = "anki" | "tsv" | "csv";
export type PosChip = Extract<Pos, "NOUN" | "VERB" | "ADJ">;

/** Mirrors the README's "State Management" table, adapted for the real
 * synchronous backend: `runPct`/`runStep` (fake progress) are gone,
 * `terms` holds the real scored set from the last ingest (all submitted
 * files scored together as one corpus), `sourceNames` and `error` back
 * the Running/Error states. */
export interface IngoState {
  phase: Phase;
  sourceNames: string[];
  terms: Term[];
  error: string | null;
  showPanel: boolean;
  showQueue: boolean;
  cutoffLo: number;
  cutoffHi: number;
  minOcc: number;
  grams: Record<NgramLength, boolean>;
  noEntities: boolean;
  noSlang: boolean;
  noKatakana: boolean;
  posOn: Record<PosChip, boolean>;
  sortKey: SortKey;
  sortDir: SortDir;
  page: number;
  pageSize: number;
  ignored: string[];
  search: string;
  modal: ModalKind;
  format: ExportFormat;
}

export const initialState: IngoState = {
  phase: "empty",
  sourceNames: [],
  terms: [],
  error: null,
  showPanel: true,
  showQueue: true,
  cutoffLo: 6000,
  cutoffHi: 100000,
  minOcc: 3,
  grams: { 1: true, 2: true, 3: true },
  noEntities: true,
  noSlang: true,
  // Off by default, unlike noEntities/noSlang: katakana loanwords are
  // often exactly the show-specific jargon this tool is for (fantasy
  // magic terms, sci-fi tech words), not noise to hide by default.
  noKatakana: false,
  posOn: { NOUN: true, VERB: true, ADJ: true },
  sortKey: "score",
  sortDir: -1,
  page: 1,
  pageSize: 10,
  ignored: [],
  search: "",
  modal: null,
  format: "anki",
};

export type IngoAction =
  | { type: "TOGGLE_PANEL" }
  | { type: "TOGGLE_QUEUE" }
  | { type: "INGEST_START"; sourceNames: string[] }
  | { type: "INGEST_SUCCESS"; terms: Term[] }
  | { type: "INGEST_ERROR"; message: string }
  | { type: "RETRY" }
  | { type: "SET_CUTOFF_LO"; value: number }
  | { type: "SET_CUTOFF_HI"; value: number }
  | { type: "INC_MIN_OCC" }
  | { type: "DEC_MIN_OCC" }
  | { type: "TOGGLE_GRAM"; ngram: NgramLength }
  | { type: "TOGGLE_ENTITIES" }
  | { type: "TOGGLE_SLANG" }
  | { type: "TOGGLE_KATAKANA" }
  | { type: "TOGGLE_POS"; pos: PosChip }
  | { type: "SET_SORT"; key: SortKey }
  | { type: "SET_PAGE"; page: number }
  | { type: "SET_PAGE_SIZE"; size: number }
  | { type: "SET_SEARCH"; query: string }
  | { type: "IGNORE_TERM"; term: string }
  | { type: "RESTORE_TERM"; term: string }
  | { type: "OPEN_MODAL"; modal: Exclude<ModalKind, null> }
  | { type: "CLOSE_MODAL" }
  | { type: "SET_FORMAT"; format: ExportFormat };

export function ingoReducer(state: IngoState, action: IngoAction): IngoState {
  switch (action.type) {
    case "TOGGLE_PANEL":
      return { ...state, showPanel: !state.showPanel };
    case "TOGGLE_QUEUE":
      return { ...state, showQueue: !state.showQueue };
    case "INGEST_START":
      return { ...state, phase: "running", sourceNames: action.sourceNames, error: null };
    case "INGEST_SUCCESS":
      return {
        ...state,
        phase: "results",
        terms: action.terms,
        page: 1,
        ignored: [],
        search: "",
      };
    case "INGEST_ERROR":
      return { ...state, phase: "error", error: action.message };
    case "RETRY":
      return { ...state, phase: "empty", error: null };
    case "SET_CUTOFF_LO":
      return { ...state, cutoffLo: Math.min(action.value, state.cutoffHi - 500) };
    case "SET_CUTOFF_HI":
      return { ...state, cutoffHi: Math.max(action.value, state.cutoffLo + 500) };
    case "INC_MIN_OCC":
      return { ...state, minOcc: Math.min(12, state.minOcc + 1) };
    case "DEC_MIN_OCC":
      // Floor of 2, not 1: ingo-api's DEFAULT_MIN_OCCURRENCE already drops
      // any term seen only once before it ever reaches the frontend, so a
      // ">=1" setting here would look adjustable but never change the
      // visible set.
      return { ...state, minOcc: Math.max(2, state.minOcc - 1) };
    case "TOGGLE_GRAM":
      return {
        ...state,
        grams: { ...state.grams, [action.ngram]: !state.grams[action.ngram] },
      };
    case "TOGGLE_ENTITIES":
      return { ...state, noEntities: !state.noEntities };
    case "TOGGLE_SLANG":
      return { ...state, noSlang: !state.noSlang };
    case "TOGGLE_KATAKANA":
      return { ...state, noKatakana: !state.noKatakana };
    case "TOGGLE_POS":
      return {
        ...state,
        posOn: { ...state.posOn, [action.pos]: !state.posOn[action.pos] },
      };
    case "SET_SORT":
      return {
        ...state,
        sortKey: action.key,
        sortDir: state.sortKey === action.key ? ((state.sortDir * -1) as SortDir) : -1,
      };
    case "SET_PAGE":
      return { ...state, page: action.page };
    case "SET_PAGE_SIZE":
      return { ...state, pageSize: action.size, page: 1 };
    case "SET_SEARCH":
      // A narrower/wider result set can shift which page makes sense,
      // same reasoning as SET_PAGE_SIZE.
      return { ...state, search: action.query, page: 1 };
    case "IGNORE_TERM":
      return { ...state, ignored: [...state.ignored, action.term] };
    case "RESTORE_TERM":
      return { ...state, ignored: state.ignored.filter((t) => t !== action.term) };
    case "OPEN_MODAL":
      return { ...state, modal: action.modal };
    case "CLOSE_MODAL":
      return { ...state, modal: null };
    case "SET_FORMAT":
      return { ...state, format: action.format };
    default:
      return state;
  }
}
