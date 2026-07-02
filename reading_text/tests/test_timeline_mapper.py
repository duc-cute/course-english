from app.utils.timeline_mapper import (
    SentenceRef,
    TimedWord,
    build_sentence_timeline,
    map_timed_words_to_timeline,
)
from app.utils.word_key import extract_word_tokens, word_key


def test_word_key_strips_edge_punctuation() -> None:
    assert word_key('"Hello,"') == "hello"
    assert word_key("world.") == "world"


def test_map_timed_words_to_word_index() -> None:
    text = "Tom showed his passport."
    tokens = ["Tom", "showed", "his", "passport"]
    timed = [
        TimedWord("Tom", 0.1, 0.3),
        TimedWord("showed", 0.35, 0.7),
        TimedWord("his", 0.75, 0.9),
        TimedWord("passport", 0.95, 1.4),
    ]

    timeline = map_timed_words_to_timeline(tokens, timed, text)

    assert len(timeline) == 4
    assert timeline[0].word_index == 0
    assert timeline[0].word == "Tom"
    assert timeline[0].start == 0.1
    assert timeline[3].word_index == 3
    assert timeline[0].char_start == 0


def test_build_sentence_timeline_from_refs() -> None:
    text = "Tom showed his passport. He entered the gate."
    tokens = extract_word_tokens(text)
    timed = [
        TimedWord("Tom", 0.0, 0.2),
        TimedWord("showed", 0.25, 0.5),
        TimedWord("his", 0.55, 0.7),
        TimedWord("passport", 0.75, 1.1),
        TimedWord("He", 1.2, 1.35),
        TimedWord("entered", 1.4, 1.7),
        TimedWord("the", 1.75, 1.9),
        TimedWord("gate", 1.95, 2.3),
    ]
    word_timeline = map_timed_words_to_timeline(tokens, timed, text)
    sentence_timeline = build_sentence_timeline(
        tokens,
        word_timeline,
        text,
        [
            SentenceRef(0, 0, 3),
            SentenceRef(1, 4, 7),
        ],
    )

    assert len(sentence_timeline) == 2
    assert sentence_timeline[0].sentence_index == 0
    assert sentence_timeline[0].start == 0.0
    assert sentence_timeline[1].sentence_index == 1
    assert sentence_timeline[1].end == 2.3


def test_build_sentence_timeline_inferred_from_text() -> None:
    text = "Hi there. Bye now."
    tokens = extract_word_tokens(text)
    timed = [
        TimedWord("Hi", 0.0, 0.2),
        TimedWord("there", 0.25, 0.5),
        TimedWord("Bye", 0.6, 0.8),
        TimedWord("now", 0.85, 1.1),
    ]
    word_timeline = map_timed_words_to_timeline(tokens, timed, text)
    sentence_timeline = build_sentence_timeline(tokens, word_timeline, text)

    assert len(sentence_timeline) == 2
    assert sentence_timeline[0].end == 0.5
    assert sentence_timeline[1].start == 0.6
