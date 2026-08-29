# UniDic pos1 -> frontend Pos. Anything not listed (particles, auxiliary
# verbs, symbols, adverbs, conjunctions, ...) is not jargon-worthy and is
# dropped by the pipeline before this map is even consulted.
POS1_TO_BUCKET = {
    "名詞": "NOUN",
    "動詞": "VERB",
    "形容詞": "ADJ",
    "形状詞": "ADJ",
    "感動詞": "INTJ",
}

# Only 動詞/形容詞/助動詞 conjugate in Japanese; using UniDic's lemma for
# these collapses inflected forms (走った -> 走る) as the README requires.
# Nouns don't conjugate, and unidic-lite's lemma field is unreliable for
# many noun entries — e.g. "東京" lemmatizes to the reading "トウキョウ",
# and some katakana loanwords get an English gloss appended ("タワー-tower")
# — so surface form is used for everything else instead of risking
# degraded display text.
LEMMA_POS1 = {"動詞", "形容詞", "助動詞"}

PROPER_NOUN_POS2 = "固有名詞"


def map_pos(pos1: str, pos2: str) -> str | None:
    """Returns the frontend Pos bucket for a UniDic pos1, or None if the
    token isn't one of the categories the product surfaces as jargon."""
    if pos1 == "名詞" and pos2 == PROPER_NOUN_POS2:
        return "PROPN"
    return POS1_TO_BUCKET.get(pos1)


def is_entity(pos1: str, pos2: str) -> bool:
    return pos1 == "名詞" and pos2 == PROPER_NOUN_POS2


def display_term(surface: str, lemma: str, pos1: str) -> str:
    """Dictionary form for conjugating POS, surface form otherwise."""
    return lemma if pos1 in LEMMA_POS1 else surface
