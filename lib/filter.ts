import type { NgramLength, Pos, Term } from "./types";

export type SortKey = "term" | "count" | "score";
export type SortDir = 1 | -1;

export interface FilterSettings {
  cutoffLo: number;
  cutoffHi: number;
  minOcc: number;
  grams: Record<NgramLength, boolean>;
  noEntities: boolean;
  noSlang: boolean;
  noKatakana: boolean;
  posOn: Partial<Record<Pos, boolean>>;
  ignored: string[];
}

/**
 * True when every character in the term is in the katakana block
 * (U+30A0–U+30FF, which covers ー and ・ too) — the script Japanese uses
 * for transliterated loanwords (タワー, コンピューター). A term that mixes
 * scripts (kanji+katakana compounds, etc.) doesn't count.
 */
const KATAKANA_ONLY = /^[゠-ヿ]+$/;
export function isKatakanaOnly(term: string): boolean {
  return KATAKANA_ONLY.test(term);
}

export interface Page<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
}

/**
 * The real reference-corpus rank, computed server-side (ingo-api's
 * pipeline/score.py, against the actual frequency data) and carried on
 * every Term. A miss there is `listLength + 1`, never rank 0 — unlisted
 * terms are rarer than the ceiling, and getting this wrong would silently
 * drop the best jargon.
 */
export function corpusRank(term: Term): number {
  return term.corpusRank;
}

/**
 * A term is shown when all hold, per the README's "Filter semantics
 * (implement exactly)": not ignored, inside the frequency window, at or
 * above the min-occurrence cutoff, its n-gram chip is on, not an excluded
 * entity, not excluded slang, not an excluded katakana-only loanword, and
 * its POS chip is on — with the prototype's fall-through: PROPN passes
 * when entities aren't excluded, INTJ passes when slang isn't excluded,
 * regardless of the NOUN/VERB/ADJ chips.
 */
export function filterTerms(terms: Term[], settings: FilterSettings): Term[] {
  return terms.filter((term) => {
    if (settings.ignored.includes(term.term)) return false;

    const rank = corpusRank(term);
    if (rank < settings.cutoffLo || rank > settings.cutoffHi) return false;

    if (term.count < settings.minOcc) return false;

    if (!settings.grams[term.ngram]) return false;

    if (settings.noEntities && term.isEntity) return false;
    if (settings.noSlang && term.isSlang) return false;
    if (settings.noKatakana && isKatakanaOnly(term.term)) return false;

    return (
      !!settings.posOn[term.pos] ||
      (term.pos === "PROPN" && !settings.noEntities) ||
      (term.pos === "INTJ" && !settings.noSlang)
    );
  });
}

export function sortTerms(terms: Term[], key: SortKey, dir: SortDir): Term[] {
  return [...terms].sort((a, b) => {
    const cmp =
      key === "term"
        ? a.term.localeCompare(b.term)
        : (a[key] as number) - (b[key] as number);
    return cmp * dir;
  });
}

/**
 * Slices `items` for the given page/size, clamping `page` into
 * `[1, pageCount]` — the prototype does this so a stored page index isn't
 * left pointing past the end once filters shrink the set. `size` 9999
 * represents "All" and naturally yields a single page.
 */
export function paginate<T>(items: T[], page: number, size: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const start = (clampedPage - 1) * size;
  return {
    items: items.slice(start, start + size),
    page: clampedPage,
    pageCount,
    total: items.length,
  };
}
