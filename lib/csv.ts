import type { Term } from "./types";

const HEADER = ["Term", "Reading", "POS", "Occurrences", "Corpus Rank", "Rarity (G2)", "Definition"];

/** RFC 4180 field escaping: quote and double-up internal quotes whenever
 * a field contains a comma, quote, or newline — definitions in
 * particular routinely contain commas. */
function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toRow(values: (string | number)[]): string {
  return values.map((v) => escapeCsvField(String(v))).join(",");
}

/** Builds a CSV string (with a UTF-8 BOM, so Excel doesn't mangle the
 * Japanese text on open) from the given terms. Pure — no React/fetch,
 * runs entirely client-side since nothing here needs the backend. */
export function toCsv(terms: Term[]): string {
  const rows = terms.map((t) =>
    toRow([t.term, t.reading ?? "", t.pos, t.count, t.corpusRank, t.score.toFixed(2), t.definition])
  );
  const BOM = String.fromCharCode(0xfeff);
  return BOM + [toRow(HEADER), ...rows].join("\r\n");
}
