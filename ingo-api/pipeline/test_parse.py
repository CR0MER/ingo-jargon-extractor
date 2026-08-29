import pytest

from pipeline.parse import parse_file, parse_mkv, parse_txt


def _as_utf8_mis_decoded_as_latin1(text: str) -> bytes:
    """Simulates a file that some other tool already corrupted: real UTF-8
    bytes were decoded as Latin-1/cp1252 and the result was saved back out
    as UTF-8. What's actually on disk is valid UTF-8 (so a plain decode
    "succeeds"), but it spells out the wrong characters."""
    return text.encode("utf-8").decode("latin1").encode("utf-8")


def test_parse_txt_passes_through_clean_utf8():
    assert parse_txt("猫が眠っている。".encode("utf-8")) == "猫が眠っている。"


def test_parse_txt_repairs_utf8_as_latin1_mojibake():
    original = "猫が魔法陣の中で眠っている。"
    corrupted = _as_utf8_mis_decoded_as_latin1(original)

    # Sanity check the fixture actually reproduces the bug: naive UTF-8
    # decoding of the corrupted bytes is NOT the original Japanese text.
    assert corrupted.decode("utf-8") != original

    assert parse_txt(corrupted) == original


def test_parse_mkv_raises_without_ffmpeg():
    with pytest.raises(ValueError, match="ffmpeg"):
        parse_mkv(b"")


def test_parse_file_rejects_unknown_extension():
    with pytest.raises(ValueError, match="Unsupported file type"):
        parse_file("clip.mkv.bak", b"")


def test_parse_file_dispatches_by_extension():
    assert parse_file("ep01.txt", "猫。".encode("utf-8")) == "猫。"
