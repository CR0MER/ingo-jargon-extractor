"""Builds a real .apkg (Anki deck package) in memory via genanki - a zip
containing a SQLite collection, not a plain-text format Anki happens to
import. Fixed model/deck IDs are genanki's documented convention: re-
importing an export with the same IDs updates the existing deck/note type
in Anki instead of creating a duplicate.
"""

import io

import genanki

_MODEL = genanki.Model(
    1980092309,
    "Ingo Basic",
    fields=[{"name": "Front"}, {"name": "Reading"}, {"name": "Back"}],
    templates=[
        {
            "name": "Card 1",
            # Reading is answer-side only, per its own field - the point
            # is not to give the furigana away before flipping the card.
            # {{#Reading}} skips the line entirely for kana-only terms
            # that never got a reading (see main.py's Term.reading).
            "qfmt": "{{Front}}",
            "afmt": '{{FrontSide}}<hr id="answer">{{#Reading}}<div>{{Reading}}</div>{{/Reading}}{{Back}}',
        }
    ],
)

_DECK_ID = 1287349102
_DECK_NAME = "Ingo Export"


def build_apkg(cards: list[tuple[str, str, str]]) -> bytes:
    """`cards` is a list of (front, reading, back) triples - `reading` may
    be an empty string for terms with no furigana. Returns the raw .apkg
    bytes, ready to hand back as an HTTP response body."""
    deck = genanki.Deck(_DECK_ID, _DECK_NAME)
    for front, reading, back in cards:
        deck.add_note(genanki.Note(model=_MODEL, fields=[front, reading, back]))

    buffer = io.BytesIO()
    genanki.Package(deck).write_to_file(buffer)
    return buffer.getvalue()
