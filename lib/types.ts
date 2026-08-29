export type Pos = "NOUN" | "VERB" | "ADJ" | "PROPN" | "INTJ";

export type NgramLength = 1 | 2 | 3;

export interface TermContext {
  line: string;
  timestamp: string;
  file: string;
}

/**
 * Matches ingo-api's `POST /ingest` response shape (see
 * ingo-api/main.py's `Term` model). `lemma` and `contexts` stay optional -
 * neither is populated by the current backend. `corpusRank` and `score`
 * (Dunning's G^2 keyness) are always set by the real pipeline.
 */
export interface Term {
  term: string;
  lemma?: string;
  /** Furigana reading (hiragana), when the term contains kanji. */
  reading?: string;
  pos: Pos;
  ngram: NgramLength;
  isEntity: boolean;
  isSlang: boolean;
  count: number;
  corpusRank: number;
  score: number;
  definition: string;
  contexts?: TermContext[];
}
