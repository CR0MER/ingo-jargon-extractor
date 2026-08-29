import io
import re
import unicodedata

import ftfy
import pysrt
import webvtt

_SPEAKER_LABEL = re.compile(r"^\s*[\[［(（]?[^\]）)：:]{1,12}[)）\]］]?\s*[:：]\s*")
_HTML_TAG = re.compile(r"<[^>]+>")
_RUBY_TEXT = re.compile(r"[｜|][^《]+《[^》]+》|《[^》]+》")


def _decode(data: bytes) -> str:
    """Decodes as UTF-8, then repairs mojibake. A common real-world case:
    a file whose UTF-8 bytes were previously mis-decoded as Latin-1/cp1252
    by some other tool and re-saved that way is still valid UTF-8 on disk
    (decoding "succeeds"), but the Japanese comes out as runs of Latin-1
    Supplement characters instead of kana/kanji. ftfy detects and reverses
    that specific corruption; text that was never mangled passes through
    unchanged.
    """
    return ftfy.fix_text(data.decode("utf-8", errors="replace"))


def _clean_line(line: str) -> str:
    line = unicodedata.normalize("NFKC", line)
    line = _RUBY_TEXT.sub("", line)
    line = _HTML_TAG.sub("", line)
    line = _SPEAKER_LABEL.sub("", line)
    return line.strip()


def parse_srt(data: bytes) -> str:
    subs = pysrt.from_string(_decode(data))
    lines = [_clean_line(sub.text) for sub in subs]
    return "\n".join(line for line in lines if line)


def parse_vtt(data: bytes) -> str:
    captions = webvtt.read_buffer(io.StringIO(_decode(data)))
    lines = [_clean_line(caption.text) for caption in captions]
    return "\n".join(line for line in lines if line)


def parse_txt(data: bytes) -> str:
    return unicodedata.normalize("NFKC", _decode(data))


def parse_mkv(_data: bytes) -> str:
    raise ValueError(
        ".mkv subtitle extraction requires ffmpeg, which isn't installed in "
        "this environment. Extract the .srt/.vtt track yourself and upload "
        "that instead."
    )


_PARSERS = {
    ".srt": parse_srt,
    ".vtt": parse_vtt,
    ".txt": parse_txt,
    ".mkv": parse_mkv,
}


def parse_file(filename: str, data: bytes) -> str:
    ext = filename[filename.rfind(".") :].lower() if "." in filename else ""
    parser = _PARSERS.get(ext)
    if parser is None:
        raise ValueError(f"Unsupported file type: {filename!r}")
    return parser(data)
