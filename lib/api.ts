import type { Term } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface IngestInput {
  files?: File[];
  text?: string;
}

/** POSTs to the real ingo-api backend's synchronous /ingest endpoint and
 * returns the finished, scored term list. No job polling — see
 * ingo-api/main.py. All files are concatenated server-side and scored as
 * one corpus, so a whole show's episodes surface jargon a single episode
 * wouldn't. */
export async function ingest(input: IngestInput): Promise<Term[]> {
  const body = new FormData();
  for (const file of input.files ?? []) body.append("files", file);
  if (input.text) body.append("text", input.text);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/ingest`, { method: "POST", body });
  } catch {
    throw new Error(`Couldn't reach the ingest service at ${API_URL}.`);
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail || `Ingest failed (${res.status}).`);
  }

  return res.json();
}

/** Fetches the reference corpus's real vocabulary size from GET /meta, so
 * the frequency-window slider can span the actual data instead of a
 * guessed ceiling. Returns null on any failure (backend not up yet,
 * network error) — callers should fall back to a sane default rather
 * than block on this. */
export async function fetchVocabSize(): Promise<number | null> {
  try {
    const res = await fetch(`${API_URL}/meta`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.vocabSize === "number" ? data.vocabSize : null;
  } catch {
    return null;
  }
}
