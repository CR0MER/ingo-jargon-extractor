import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";
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

describe("toCsv", () => {
  it("starts with a UTF-8 BOM so Excel doesn't mangle Japanese text", () => {
    const csv = toCsv([makeTerm()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("writes a header row and one row per term", () => {
    const csv = toCsv([
      makeTerm({ term: "猫", reading: "ねこ", pos: "NOUN", count: 3, corpusRank: 1509, score: 12.5, definition: "cat" }),
    ]);
    const lines = csv.slice(1).split("\r\n"); // slice(1) drops the BOM

    expect(lines[0]).toBe("Term,Reading,POS,Occurrences,Corpus Rank,Rarity (G2),Definition");
    expect(lines[1]).toBe("猫,ねこ,NOUN,3,1509,12.50,cat");
  });

  it("blanks the reading column for terms with no furigana", () => {
    const csv = toCsv([makeTerm({ term: "タワー", reading: undefined })]);
    const rows = csv.slice(1).split("\r\n");
    expect(rows[1].startsWith("タワー,,")).toBe(true);
  });

  it("quotes fields containing a comma, quote, or newline (RFC 4180)", () => {
    const csv = toCsv([
      makeTerm({ term: "comma,term", definition: 'has "quotes" and, a comma' }),
    ]);
    const rows = csv.slice(1).split("\r\n");
    expect(rows[1]).toContain('"comma,term"');
    expect(rows[1]).toContain('"has ""quotes"" and, a comma"');
  });

  it("produces just the header row for an empty term list", () => {
    const csv = toCsv([]);
    expect(csv.slice(1)).toBe("Term,Reading,POS,Occurrences,Corpus Rank,Rarity (G2),Definition");
  });
});
