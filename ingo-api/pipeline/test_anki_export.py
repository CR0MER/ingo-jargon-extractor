import sqlite3
import tempfile
import zipfile

from pipeline.anki_export import build_apkg


def _read_note_fields(apkg_bytes: bytes) -> list[str]:
    with tempfile.TemporaryDirectory() as tmp:
        zip_path = f"{tmp}/deck.apkg"
        with open(zip_path, "wb") as f:
            f.write(apkg_bytes)

        with zipfile.ZipFile(zip_path) as z:
            z.extract("collection.anki2", tmp)

        conn = sqlite3.connect(f"{tmp}/collection.anki2")
        rows = conn.execute("select flds from notes").fetchall()
        conn.close()
        return [row[0] for row in rows]


def test_build_apkg_is_a_valid_zip_with_the_expected_entries():
    apkg_bytes = build_apkg([("猫", "ねこ", "cat")])
    assert apkg_bytes[:2] == b"PK"  # zip magic number

    with tempfile.TemporaryDirectory() as tmp:
        zip_path = f"{tmp}/deck.apkg"
        with open(zip_path, "wb") as f:
            f.write(apkg_bytes)
        with zipfile.ZipFile(zip_path) as z:
            assert set(z.namelist()) == {"collection.anki2", "media"}


def test_build_apkg_stores_front_reading_and_back_as_separate_fields():
    fields = _read_note_fields(build_apkg([("猫", "ねこ", "cat"), ("犬", "いぬ", "dog")]))
    # Anki joins a note's fields with \x1f internally.
    assert fields == ["猫\x1fねこ\x1fcat", "犬\x1fいぬ\x1fdog"]


def test_build_apkg_allows_an_empty_reading():
    # Kana-only terms (loanwords, interjections) never get a furigana
    # reading - see main.py's Term.reading / _contains_kanji.
    fields = _read_note_fields(build_apkg([("タワー", "", "tower")]))
    assert fields == ["タワー\x1f\x1ftower"]


def test_build_apkg_with_no_cards_still_produces_a_valid_empty_deck():
    fields = _read_note_fields(build_apkg([]))
    assert fields == []
