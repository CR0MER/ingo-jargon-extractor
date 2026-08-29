from jamdict import Jamdict

_MAX_LEN = 120

_jam = Jamdict()


def define(term: str) -> str:
    result = _jam.lookup(term)
    if not result.entries:
        return ""

    senses = result.entries[0].senses
    if not senses:
        return ""

    gloss = "; ".join(str(g) for g in senses[0].gloss) if senses[0].gloss else str(senses[0])
    if len(gloss) > _MAX_LEN:
        gloss = gloss[: _MAX_LEN - 1].rstrip() + "…"
    return gloss
