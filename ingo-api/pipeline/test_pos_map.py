from pipeline.pos_map import display_term, is_entity, map_pos


def test_maps_core_pos_buckets():
    assert map_pos("名詞", "普通名詞") == "NOUN"
    assert map_pos("動詞", "一般") == "VERB"
    assert map_pos("形容詞", "一般") == "ADJ"
    assert map_pos("形状詞", "一般") == "ADJ"
    assert map_pos("感動詞", "一般") == "INTJ"


def test_proper_noun_maps_to_propn_and_flags_entity():
    assert map_pos("名詞", "固有名詞") == "PROPN"
    assert is_entity("名詞", "固有名詞") is True
    assert is_entity("名詞", "普通名詞") is False


def test_particles_and_auxiliaries_are_not_jargon_candidates():
    assert map_pos("助詞", "格助詞") is None
    assert map_pos("補助記号", "読点") is None


def test_display_term_uses_lemma_only_for_conjugating_pos():
    # Verbs/adjectives/auxiliaries collapse inflected surface forms to
    # their dictionary lemma (README: "lemma before lookup, always").
    assert display_term("走っ", "走る", "動詞") == "走る"
    assert display_term("高かっ", "高い", "形容詞") == "高い"

    # Nouns don't conjugate, and unidic-lite's lemma is unreliable for
    # some noun entries (e.g. proper nouns lemmatize to their reading) -
    # surface form is used instead.
    assert display_term("東京", "トウキョウ", "名詞") == "東京"
    assert display_term("タワー", "タワー-tower", "名詞") == "タワー"
