from collections import Counter
from typing import Optional

from fastapi import FastAPI, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pipeline.definitions import define
from pipeline.nlp import tokenize
from pipeline.parse import parse_file
from pipeline.score import corpus_rank, katakana_to_hiragana, keyness

# Dunning's G^2 threshold for p < 0.0001 at 1 degree of freedom - the
# standard corpus-linguistics keyness cutoff (Rayson & Garside 2000).
DEFAULT_MIN_KEYNESS = 15.13
DEFAULT_MIN_OCCURRENCE = 2

_KANJI_START, _KANJI_END = "一", "鿿"


def _contains_kanji(text: str) -> bool:
    return any(_KANJI_START <= ch <= _KANJI_END for ch in text)

app = FastAPI(title="ingo-api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class Term(BaseModel):
    term: str
    lemma: Optional[str] = None
    reading: Optional[str] = None
    pos: str
    ngram: int
    isEntity: bool
    isSlang: bool
    count: int
    corpusRank: int
    score: float
    definition: str


def _score_text(
    text: str,
    min_keyness: float = DEFAULT_MIN_KEYNESS,
    min_occurrence: int = DEFAULT_MIN_OCCURRENCE,
) -> list[Term]:
    tokens = tokenize(text)
    if not tokens:
        return []

    total = len(tokens)
    # Group by (display term, POS): the same surface word under different
    # POS tags (rare, but possible) is kept as two distinct rows.
    groups: dict[tuple[str, str], list] = {}
    for t in tokens:
        groups.setdefault((t.term, t.pos), []).append(t)

    counts = Counter({key: len(toks) for key, toks in groups.items()})

    results: list[Term] = []
    for (term, pos), toks in groups.items():
        count = counts[(term, pos)]
        if count < min_occurrence:
            continue

        reading = toks[0].reading
        kw = keyness(term, count, total, reading)
        # Jargon = overrepresented in this text AND significantly so -
        # a term that's simply less common here than in the reference
        # corpus doesn't qualify, no matter how large its G^2.
        if not kw.overrepresented or kw.g2 < min_keyness:
            continue

        # Furigana annotates kanji, not kana - a kana-only term (a
        # loanword like タワー, or an interjection like ありがとう) never
        # gets one, regardless of what reading fugashi reports.
        display_reading = (
            katakana_to_hiragana(reading) if reading and _contains_kanji(term) else None
        )

        results.append(
            Term(
                term=term,
                reading=display_reading,
                pos=pos,
                ngram=1,
                isEntity=toks[0].is_entity,
                isSlang=False,
                count=count,
                corpusRank=corpus_rank(term, reading),
                score=kw.g2,
                definition=define(term),
            )
        )

    return results


@app.post("/ingest", response_model=list[Term])
async def ingest(
    file: Optional[UploadFile] = None,
    text: Optional[str] = Form(None),
    min_keyness: float = Form(DEFAULT_MIN_KEYNESS),
    min_occurrence: int = Form(DEFAULT_MIN_OCCURRENCE),
) -> list[Term]:
    if file is None and not text:
        raise HTTPException(400, "Provide either a file or text.")

    if file is not None:
        data = await file.read()
        try:
            source_text = parse_file(file.filename or "", data)
        except ValueError as e:
            raise HTTPException(400, str(e)) from e
    else:
        source_text = text or ""

    if not source_text.strip():
        raise HTTPException(400, "No text extracted from input.")

    return _score_text(source_text, min_keyness, min_occurrence)
