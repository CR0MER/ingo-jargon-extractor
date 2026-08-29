import pytest

from pipeline import score as score_module


@pytest.fixture(autouse=True)
def fixed_freq_map(monkeypatch):
    monkeypatch.setattr(score_module, "_FREQ_MAP", {"猫": 100, "する": 5})
    monkeypatch.setattr(score_module, "_MISS_RANK", 101)
    # Small, hand-checkable reference model instead of the real ~274k-word
    # Zipfian fit: reference_count(rank) = 100_000 / rank.
    monkeypatch.setattr(score_module, "REFERENCE_TOTAL_TOKENS", 1_000_000)
    monkeypatch.setattr(score_module, "_ZIPF_CONSTANT", 100_000)


def test_corpus_rank_direct_hit():
    assert score_module.corpus_rank("猫") == 100


def test_corpus_rank_miss_is_list_length_plus_one_not_zero():
    # README: a missing term is rarer than the ceiling, not rank 0.
    assert score_module.corpus_rank("未知語") == 101


def test_corpus_rank_falls_back_to_reading_when_lemma_misses():
    # 為る (a UniDic kanji lemma) isn't in the map, but its reading's
    # hiragana form スル -> する is - this is the real bug this fallback
    # fixes (する otherwise ranking as absurdly rare).
    assert score_module.corpus_rank("為る", "スル") == 5


def test_corpus_rank_takes_whichever_of_lemma_or_reading_is_more_common():
    assert score_module.corpus_rank("猫", "スル") == 5


def test_katakana_to_hiragana_conversion():
    assert score_module.katakana_to_hiragana("スル") == "する"
    assert score_module.katakana_to_hiragana("ネコ") == "ねこ"
    assert score_module.katakana_to_hiragana("abc") == "abc"


def test_reference_count_follows_zipf_law():
    assert score_module.reference_count(1) == pytest.approx(100_000)
    assert score_module.reference_count(100) == pytest.approx(1_000)
    assert score_module.reference_count(1000) == pytest.approx(100)


def test_xlogx_ratio_treats_zero_observed_as_zero_contribution():
    # Standard log-likelihood convention: lim x->0 of x*ln(x) = 0, not
    # -inf or an error.
    assert score_module._xlogx_ratio(0, 5) == 0.0
    assert score_module._xlogx_ratio(5, 0) == 0.0
    assert score_module._xlogx_ratio(10, 10) == pytest.approx(0.0)


def test_keyness_flags_strongly_overrepresented_term_as_significant():
    # 猫 (rank 100 -> ~1000/1,000,000 = 0.1% reference rate) appearing 10
    # times in a 100-token target (10% local rate) is 100x overrepresented -
    # should be flagged both overrepresented and with a large G^2.
    result = score_module.keyness("猫", local_count=10, total_tokens=100)
    assert result.overrepresented is True
    assert result.g2 > 15.13  # standard p<0.0001 keyness threshold


def test_keyness_not_overrepresented_when_locally_rarer_than_reference():
    # 猫's reference rate is 0.1%; appearing just once in a 10,000-token
    # target (0.01% local rate) is *less* frequent than in the reference -
    # not jargon, regardless of G^2 magnitude.
    result = score_module.keyness("猫", local_count=1, total_tokens=10_000)
    assert result.overrepresented is False


def test_keyness_uses_reading_fallback_for_rank_lookup():
    # A genuinely unseen word at the same count/total as する (looked up
    # via its kanji lemma 為る, resolved to the common rank 5 through the
    # reading fallback) should look far more "surprising" (higher G^2),
    # since 為る's true frequency is common, not absent from the reference.
    common_via_fallback = score_module.keyness("為る", local_count=3, total_tokens=200, reading="スル")
    genuinely_rare = score_module.keyness("未知語", local_count=3, total_tokens=200)
    assert common_via_fallback.g2 < genuinely_rare.g2
