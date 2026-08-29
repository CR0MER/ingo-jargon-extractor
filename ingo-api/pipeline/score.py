"""
Loads data/freq_ja.json.gz once at import time and scores terms against it
using Dunning's log-likelihood ratio (G^2) keyness test, comparing the
target text's word frequencies against the reference corpus.

Corpus rank: a miss is `len(freq_map) + 1`, never rank 0 - per the
README, treating a miss as maximally common would silently drop the best
jargon, since genuinely niche terms are exactly the ones missing from the
list.

Reading fallback: UniDic's dictionary-form lemma for some extremely
common auxiliary verbs is conventionally kanji (為る, 有る, 居る) even
though real text - and this frequency list - almost always uses the kana
spelling (する, ある, いる). Looked up by kanji lemma alone, these rank as
absurdly rare (為る: ~34,500) when they're among the most common words in
the language (する: 11). Per the README's "reading matters" note, also
check the reading's hiragana form and take whichever rank is more common.

Keyness (G^2): the standard 2x2-contingency-table log-likelihood ratio
(Dunning 1993) comparing a term's frequency in the target text against
its frequency in the reference corpus:

           | target text | reference corpus |
    term   |     a       |        b         |
    other  |     c       |        d         |

G^2 = 2 * sum(O * ln(O/E)) over the four cells, where E is each cell's
expected count under the null hypothesis that the term is distributed
the same way in both corpora. A term is "jargon" here when it's both
overrepresented (locally more frequent than in the reference) and its
G^2 clears a significance threshold (the caller's job - see main.py).

The reference bank only gives *rank*, not raw frequency counts or a
corpus size - so `b` (the reference count) can't be read directly. It's
estimated from rank via a Zipfian model: frequency(rank) ~ C / rank,
with C fit so total estimated frequency across the whole vocabulary
equals an assumed reference corpus size. That assumed size (100M tokens)
is a real, disclosed approximation - Yomitan/BCCWJ-derived frequency
lists are typically built from corpora of this order of magnitude, but
the exact figure isn't in the data. If the real corpus size ever becomes
available, replace `REFERENCE_TOTAL_TOKENS` with it.
"""

import gzip
import json
import math
import os
from dataclasses import dataclass

_FREQ_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "freq_ja.json.gz")

with gzip.open(_FREQ_PATH, "rt", encoding="utf-8") as _f:
    _FREQ_MAP: dict[str, int] = json.load(_f)

_MISS_RANK = len(_FREQ_MAP) + 1

_KATAKANA_START, _KATAKANA_END = "ァ", "ヶ"
_KATA_TO_HIRA_OFFSET = 0x60

# Assumed reference corpus size backing the Zipfian rank -> count model
# (see module docstring). Only the order of magnitude matters here, since
# G^2 scales with sample size - this isn't a real measured figure.
REFERENCE_TOTAL_TOKENS = 100_000_000

_VOCAB_SIZE = len(_FREQ_MAP)
_HARMONIC_SUM = sum(1 / r for r in range(1, _VOCAB_SIZE + 1))
_ZIPF_CONSTANT = REFERENCE_TOTAL_TOKENS / _HARMONIC_SUM


def katakana_to_hiragana(text: str) -> str:
    return "".join(
        chr(ord(ch) - _KATA_TO_HIRA_OFFSET)
        if _KATAKANA_START <= ch <= _KATAKANA_END
        else ch
        for ch in text
    )


def corpus_rank(term: str, reading: str | None = None) -> int:
    candidates = []
    if term in _FREQ_MAP:
        candidates.append(_FREQ_MAP[term])
    if reading:
        hiragana = katakana_to_hiragana(reading)
        if hiragana in _FREQ_MAP:
            candidates.append(_FREQ_MAP[hiragana])
    return min(candidates) if candidates else _MISS_RANK


def reference_count(rank: int) -> float:
    """Estimated raw occurrence count of a word at this rank within the
    assumed `REFERENCE_TOTAL_TOKENS`-token reference corpus, via Zipf's
    law (frequency ~ 1/rank)."""
    return _ZIPF_CONSTANT / rank


def _xlogx_ratio(observed: float, expected: float) -> float:
    """O * ln(O/E), with the standard convention that a zero observed
    count contributes 0 (lim x->0 of x*ln(x) = 0)."""
    if observed <= 0 or expected <= 0:
        return 0.0
    return observed * math.log(observed / expected)


@dataclass(frozen=True)
class Keyness:
    g2: float
    overrepresented: bool


def keyness(term: str, local_count: int, total_tokens: int, reading: str | None = None) -> Keyness:
    """Dunning's G^2 for `term`: local_count/total_tokens in the target
    text vs. its estimated frequency in the reference corpus."""
    rank = corpus_rank(term, reading)
    a = local_count
    b = reference_count(rank)
    c = total_tokens - a
    d = REFERENCE_TOTAL_TOKENS - b
    n = total_tokens + REFERENCE_TOTAL_TOKENS

    row_total = a + b
    e_a = total_tokens * row_total / n
    e_b = REFERENCE_TOTAL_TOKENS * row_total / n
    e_c = total_tokens - e_a
    e_d = REFERENCE_TOTAL_TOKENS - e_b

    g2 = 2 * (
        _xlogx_ratio(a, e_a)
        + _xlogx_ratio(b, e_b)
        + _xlogx_ratio(c, e_c)
        + _xlogx_ratio(d, e_d)
    )
    overrepresented = (a / total_tokens) > (b / REFERENCE_TOTAL_TOKENS)

    return Keyness(g2=g2, overrepresented=overrepresented)
