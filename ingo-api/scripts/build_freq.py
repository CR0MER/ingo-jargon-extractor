"""
Builds ingo-api/data/freq_ja.json.gz from the raw Yomitan term_meta_bank
files. Run once at build time; the output is committed and never
regenerated at request time.

Per the README's "Reference frequency list" section:
- The raw bank is an array of [term, "freq", value] triples, and value has
  two shapes: a plain {value, displayValue} or a reading-scoped
  {reading, frequency: {value, displayValue}}.
- Terms with a "㋕" in displayValue belong to the other sub-corpus
  (written vs. spoken) and must not be merged with the un-suffixed one.
- Where a surface still has multiple ranks after that, take the lowest
  (commonest) — overestimating commonness yields fewer false positives
  than the reverse.

One thing the README doesn't call out, found by doing the "verify against
a handful of known-common words" check it recommends: の/は/に/を/と — the
five most common words in the language — exist in this bank *only* as
㋕-marked entries, with no unmarked alternative. Unconditionally dropping
every ㋕ entry (as a literal reading of "drop the other sub-corpus"
suggests) erases them entirely, which is a far worse bug than the one the
README is warning about. So: prefer the unmarked entries for a term when
any exist (this is what correctly keeps 顔 at rank 78 instead of 21491,
matching the README's own worked example), but fall back to the ㋕ entries
when a term has no unmarked entry at all, rather than losing it.
"""

import glob
import gzip
import json
import os

RAW_GLOB = os.path.join(os.path.dirname(__file__), "..", "..", "term_meta_bank_*.json")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "freq_ja.json.gz")


def _extract_value(val: object) -> int | None:
    v = val.get("frequency", val) if isinstance(val, dict) else {"value": val}
    if not isinstance(v, dict) or "value" not in v:
        return None
    return v["value"]


def _is_marked(val: object) -> bool:
    v = val.get("frequency", val) if isinstance(val, dict) else {}
    display = str(v.get("displayValue", "")) if isinstance(v, dict) else ""
    return "㋕" in display


def build() -> dict[str, int]:
    unmarked: dict[str, list[int]] = {}
    marked: dict[str, list[int]] = {}
    paths = sorted(glob.glob(RAW_GLOB))
    if not paths:
        raise FileNotFoundError(f"No term_meta_bank_*.json found matching {RAW_GLOB}")

    for path in paths:
        with open(path, encoding="utf-8") as f:
            bank = json.load(f)
        for term, kind, val in bank:
            if kind != "freq":
                continue
            value = _extract_value(val)
            if value is None:
                continue
            bucket = marked if _is_marked(val) else unmarked
            bucket.setdefault(term, []).append(value)

    best: dict[str, int] = {}
    for term in unmarked.keys() | marked.keys():
        candidates = unmarked.get(term) or marked[term]
        best[term] = min(candidates)

    return best


def main() -> None:
    freq_map = build()
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with gzip.open(OUTPUT_PATH, "wt", encoding="utf-8") as f:
        json.dump(freq_map, f, ensure_ascii=False)
    print(f"Wrote {len(freq_map)} entries to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
