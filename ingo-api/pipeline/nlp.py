"""Japanese tokenization via fugashi (MeCab bindings) + unidic-lite."""

from dataclasses import dataclass

import fugashi

from .pos_map import display_term, is_entity, map_pos

_tagger = fugashi.Tagger()


@dataclass(frozen=True)
class Token:
    surface: str
    term: str
    pos: str
    is_entity: bool
    reading: str | None


def tokenize(text: str) -> list[Token]:
    """Tokenizes and lemmatizes text, dropping anything that isn't one of
    the product's five jargon-relevant POS buckets (particles, auxiliary
    verbs, symbols, adverbs, conjunctions, etc. are not candidate jargon)."""
    tokens: list[Token] = []
    for word in _tagger(text):
        feature = word.feature
        pos1 = getattr(feature, "pos1", None)
        pos2 = getattr(feature, "pos2", None)
        if pos1 is None:
            continue

        pos = map_pos(pos1, pos2 or "")
        if pos is None:
            continue

        lemma = getattr(feature, "lemma", None) or word.surface
        term = display_term(word.surface, lemma, pos1)
        reading = getattr(feature, "kana", None)

        tokens.append(
            Token(
                surface=word.surface,
                term=term,
                pos=pos,
                is_entity=is_entity(pos1, pos2 or ""),
                reading=reading,
            )
        )
    return tokens
