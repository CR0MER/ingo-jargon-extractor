import type { Term } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface IngestInput {
  file?: File;
  text?: string;
}

/** POSTs to the real ingo-api backend's synchronous /ingest endpoint and
 * returns the finished, scored term list. No job polling — see
 * ingo-api/main.py. */
export async function ingest(input: IngestInput): Promise<Term[]> {
  const body = new FormData();
  if (input.file) body.append("file", input.file);
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
