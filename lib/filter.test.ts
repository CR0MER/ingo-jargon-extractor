import { describe, expect, it } from "vitest";
import { corpusRank, filterTerms, isKatakanaOnly, paginate, sortTerms } from "./filter";
import type { FilterSettings } from "./filter";
import type { Term } from "./types";

function makeTerm(overrides: Partial<Term> = {}): Term {
  return {
    term: "term",
    pos: "NOUN",
    ngram: 1,
    isEntity: false,
    isSlang: false,
    count: 5,
    corpusRank: 10000,
    score: 5,
    definition: "",
    ...overrides,
  };
}

function baseSettings(overrides: Partial<FilterSettings> = {}): FilterSettings {
  return {
    cutoffLo: 0,
    cutoffHi: 1_000_000,
    minOcc: 0,
    grams: { 1: true, 2: true, 3: true },
    noEntities: false,
    noSlang: false,
    noKatakana: false,
    posOn: { NOUN: true, VERB: true, ADJ: true },
    ignored: [],
    search: "",
    ...overrides,
  };
}

describe("corpusRank", () => {
  it("reads the real rank the backend already computed", () => {
    expect(corpusRank(makeTerm({ corpusRank: 18500 }))).toBe(18500);
    expect(corpusRank(makeTerm({ corpusRank: 25500 }))).toBe(25500);
  });
});

describe("isKatakanaOnly", () => {
  it("is true only when every character is katakana", () => {
    expect(isKatakanaOnly("タワー")).toBe(true);
    expect(isKatakanaOnly("コンピューター")).toBe(true);
    expect(isKatakanaOnly("魔法陣")).toBe(false);
    expect(isKatakanaOnly("魔法タワー")).toBe(false);
    expect(isKatakanaOnly("ありがとう")).toBe(false); // hiragana, not katakana
  });
});

describe("filterTerms", () => {
  it("includes terms at both edges of the frequency window (inclusive)", () => {
    const lo = makeTerm({ term: "lo-edge", corpusRank: 18500 });
    const hi = makeTerm({ term: "hi-edge", corpusRank: 25500 });
    const belowLo = makeTerm({ term: "below-lo", corpusRank: 9500 });
    const aboveHi = makeTerm({ term: "above-hi", corpusRank: 33000 });

    const result = filterTerms(
      [lo, hi, belowLo, aboveHi],
      baseSettings({ cutoffLo: 18500, cutoffHi: 25500 })
    );

    expect(result.map((t) => t.term)).toEqual(["lo-edge", "hi-edge"]);
  });

  it("applies the min-occurrence cutoff inclusively", () => {
    const atMin = makeTerm({ term: "at-min", count: 3 });
    const belowMin = makeTerm({ term: "below-min", count: 2 });

    const result = filterTerms([atMin, belowMin], baseSettings({ minOcc: 3 }));

    expect(result.map((t) => t.term)).toEqual(["at-min"]);
  });

  it("respects each n-gram toggle independently", () => {
    const terms = [
      makeTerm({ term: "one", ngram: 1 }),
      makeTerm({ term: "two", ngram: 2 }),
      makeTerm({ term: "three", ngram: 3 }),
    ];

    expect(
      filterTerms(terms, baseSettings({ grams: { 1: true, 2: false, 3: false } })).map(
        (t) => t.term
      )
    ).toEqual(["one"]);
    expect(
      filterTerms(terms, baseSettings({ grams: { 1: false, 2: true, 3: false } })).map(
        (t) => t.term
      )
    ).toEqual(["two"]);
    expect(
      filterTerms(terms, baseSettings({ grams: { 1: false, 2: false, 3: true } })).map(
        (t) => t.term
      )
    ).toEqual(["three"]);
  });

  it("excludes named entities when noEntities is on, with PROPN fall-through when off", () => {
    const propn = makeTerm({ term: "propn", pos: "PROPN", isEntity: true });

    // noEntities on: excluded outright, regardless of the POS chip row
    // (PROPN has no chip of its own).
    expect(
      filterTerms([propn], baseSettings({ noEntities: true })).map((t) => t.term)
    ).toEqual([]);

    // noEntities off: PROPN has no posOn entry, but the fall-through admits
    // it anyway.
    expect(
      filterTerms([propn], baseSettings({ noEntities: false })).map((t) => t.term)
    ).toEqual(["propn"]);
  });

  it("excludes slang when noSlang is on, with INTJ fall-through when off", () => {
    const intj = makeTerm({ term: "intj", pos: "INTJ", isSlang: true });

    expect(
      filterTerms([intj], baseSettings({ noSlang: true })).map((t) => t.term)
    ).toEqual([]);
    expect(
      filterTerms([intj], baseSettings({ noSlang: false })).map((t) => t.term)
    ).toEqual(["intj"]);
  });

  it("excludes katakana-only terms when noKatakana is on", () => {
    const loanword = makeTerm({ term: "タワー" });
    const kanjiTerm = makeTerm({ term: "魔法陣" });
    const mixedTerm = makeTerm({ term: "魔法タワー" });

    const result = filterTerms(
      [loanword, kanjiTerm, mixedTerm],
      baseSettings({ noKatakana: true })
    );

    expect(result.map((t) => t.term)).toEqual(["魔法陣", "魔法タワー"]);
  });

  it("respects POS chip combinations for NOUN/VERB/ADJ", () => {
    const terms = [
      makeTerm({ term: "n", pos: "NOUN" }),
      makeTerm({ term: "v", pos: "VERB" }),
      makeTerm({ term: "a", pos: "ADJ" }),
    ];

    const result = filterTerms(
      terms,
      baseSettings({ posOn: { NOUN: true, VERB: false, ADJ: true } })
    );

    expect(result.map((t) => t.term)).toEqual(["n", "a"]);
  });

  it("filters by search query, case-insensitively, against term and reading", () => {
    const kanji = makeTerm({ term: "魔法陣", reading: "まほうじん" });
    const loanword = makeTerm({ term: "タワー" });
    const other = makeTerm({ term: "剣" });

    expect(
      filterTerms([kanji, loanword, other], baseSettings({ search: "魔法" })).map(
        (t) => t.term
      )
    ).toEqual(["魔法陣"]);

    // Matches via the furigana reading too, not just the displayed term.
    expect(
      filterTerms([kanji, loanword, other], baseSettings({ search: "まほう" })).map(
        (t) => t.term
      )
    ).toEqual(["魔法陣"]);

    expect(
      filterTerms([kanji, loanword, other], baseSettings({ search: "TAWA" })).map(
        (t) => t.term
      )
    ).toEqual([]);

    // Blank/whitespace-only query matches everything.
    expect(
      filterTerms([kanji, loanword, other], baseSettings({ search: "  " })).map(
        (t) => t.term
      )
    ).toEqual(["魔法陣", "タワー", "剣"]);
  });

  it("removes ignored terms", () => {
    const terms = [makeTerm({ term: "keep" }), makeTerm({ term: "drop" })];

    const result = filterTerms(terms, baseSettings({ ignored: ["drop"] }));

    expect(result.map((t) => t.term)).toEqual(["keep"]);
  });
});

describe("sortTerms", () => {
  const terms = [
    makeTerm({ term: "banana", count: 5, score: 2 }),
    makeTerm({ term: "apple", count: 9, score: 8 }),
    makeTerm({ term: "cherry", count: 1, score: 5 }),
  ];

  it("sorts ascending and flips to descending", () => {
    const asc = sortTerms(terms, "term", 1).map((t) => t.term);
    expect(asc).toEqual(["apple", "banana", "cherry"]);

    const desc = sortTerms(terms, "term", -1).map((t) => t.term);
    expect(desc).toEqual(["cherry", "banana", "apple"]);
  });

  it("sorts by count and score", () => {
    expect(sortTerms(terms, "count", -1).map((t) => t.term)).toEqual([
      "apple",
      "banana",
      "cherry",
    ]);
    expect(sortTerms(terms, "score", 1).map((t) => t.term)).toEqual([
      "banana",
      "cherry",
      "apple",
    ]);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 22 }, (_, i) => i + 1);

  it("slices the requested page", () => {
    expect(paginate(items, 1, 10)).toMatchObject({
      items: items.slice(0, 10),
      page: 1,
      pageCount: 3,
      total: 22,
    });
    expect(paginate(items, 3, 10)).toMatchObject({
      items: items.slice(20, 22),
      page: 3,
      pageCount: 3,
      total: 22,
    });
  });

  it("treats size 9999 as a single 'All' page", () => {
    const result = paginate(items, 1, 9999);
    expect(result.items).toEqual(items);
    expect(result.pageCount).toBe(1);
  });

  it("clamps the page index down when filters shrink the set", () => {
    const shrunk = items.slice(0, 3); // only 1 page at size 10 now
    const result = paginate(shrunk, 3, 10);

    expect(result.page).toBe(1);
    expect(result.pageCount).toBe(1);
    expect(result.items).toEqual(shrunk);
  });
});
