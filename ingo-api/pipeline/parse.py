"""
Extracts plain text from subtitle/text input. Per the README:
- .srt via pysrt, .vtt via webvtt-py, .txt as raw text.
- Strip speaker labels, HTML tags, and furigana ruby annotations.
- NFKC-normalize early

.mkv extraction needs ffmpeg to pull the embedded subtitle track, which
isn't available in this environment — raises rather than silently
skipping, so a .mkv upload fails loudly instead of returning empty text.
"""

import io
import re
import unicodedata

import pysrt
import webvtt

_SPEAKER_LABEL = re.compile(r"^\s*[\[［(（]?[^\]）)：:]{1,12}[)）\]］]?\s*[:：]\s*")
_HTML_TAG = re.compile(r"<[^>]+>")
_RUBY_TEXT = re.compile(r"[｜|][^《]+《[^》]+》|《[^》]+》")


def _clean_line(line: str) -> str:
    line = unicodedata.normalize("NFKC", line)
    line = _RUBY_TEXT.sub("", line)
    line = _HTML_TAG.sub("", line)
    line = _SPEAKER_LABEL.sub("", line)
    return line.strip()


def parse_srt(data: bytes) -> str:
    subs = pysrt.from_string(data.decode("utf-8", errors="replace"))
    lines = [_clean_line(sub.text) for sub in subs]
    return "\n".join(line for line in lines if line)


def parse_vtt(data: bytes) -> str:
    captions = webvtt.read_buffer(io.StringIO(data.decode("utf-8", errors="replace")))
    lines = [_clean_line(caption.text) for caption in captions]
    return "\n".join(line for line in lines if line)


def parse_txt(data: bytes) -> str:
    return unicodedata.normalize("NFKC", data.decode("utf-8", errors="replace"))


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
