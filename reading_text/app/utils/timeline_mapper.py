import re
from dataclasses import dataclass

from app.models.timeline import SentenceTimelineItem, WordTimelineItem
from app.utils.word_key import word_key

SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")


@dataclass(frozen=True)
class TimedWord:
    text: str
    start: float
    end: float


@dataclass(frozen=True)
class SentenceRef:
    sentence_index: int
    start_word_index: int
    end_word_index: int


def map_timed_words_to_timeline(
    reference_tokens: list[str],
    timed_words: list[TimedWord],
    text: str,
) -> list[WordTimelineItem]:
    """Greedy-align Whisper timed words onto Spring Boot token indices."""
    matches: dict[int, tuple[float, float]] = {}
    ref_idx = 0

    for timed in timed_words:
        key = word_key(timed.text)
        if not key:
            continue

        while ref_idx < len(reference_tokens) and word_key(reference_tokens[ref_idx]) != key:
            ref_idx += 1

        if ref_idx >= len(reference_tokens):
            break

        matches[ref_idx] = (timed.start, max(timed.end, timed.start + 0.01))
        ref_idx += 1

    total_duration = max((t.end for t in timed_words), default=0.0)
    return _complete_word_timeline(reference_tokens, matches, text, total_duration)


def _complete_word_timeline(
    tokens: list[str],
    matches: dict[int, tuple[float, float]],
    text: str,
    total_duration: float,
) -> list[WordTimelineItem]:
    items: list[WordTimelineItem] = []
    char_cursor = 0

    for index, token in enumerate(tokens):
        if index in matches:
            start, end = matches[index]
        else:
            start, end = _interpolate_time(index, matches, total_duration, len(tokens))

        char_start, char_end = _find_char_span(text, token, char_cursor)
        char_cursor = char_end if char_end > char_cursor else char_cursor

        items.append(
            WordTimelineItem(
                wordIndex=index,
                word=token,
                start=round(start, 3),
                end=round(end, 3),
                charStart=char_start,
                charEnd=char_end,
            )
        )

    return items


def _interpolate_time(
    index: int,
    matches: dict[int, tuple[float, float]],
    total_duration: float,
    token_count: int,
) -> tuple[float, float]:
    prev_idx = max((i for i in matches if i < index), default=None)
    next_idx = min((i for i in matches if i > index), default=None)

    if prev_idx is not None and next_idx is not None:
        prev_end = matches[prev_idx][1]
        next_start = matches[next_idx][0]
        gap = max(next_start - prev_end, 0.01)
        steps = next_idx - prev_idx
        offset = (index - prev_idx) / steps
        start = prev_end + gap * (offset - 1 / steps)
        end = prev_end + gap * offset
        return max(start, 0.0), max(end, start + 0.01)

    if prev_idx is not None:
        start = matches[prev_idx][1]
        end = min(start + 0.2, total_duration or start + 0.2)
        return start, end

    if next_idx is not None:
        end = matches[next_idx][0]
        start = max(end - 0.2, 0.0)
        return start, end

    slot = (total_duration or 1.0) / max(token_count, 1)
    start = index * slot
    return start, start + slot


def _find_char_span(text: str, token: str, search_from: int) -> tuple[int | None, int | None]:
    if not token:
        return None, None
    idx = text.find(token, search_from)
    if idx < 0:
        idx = text.lower().find(token.lower(), search_from)
    if idx < 0:
        return None, None
    return idx, idx + len(token)


def build_sentence_timeline(
    reference_tokens: list[str],
    word_timeline: list[WordTimelineItem],
    text: str,
    sentence_refs: list[SentenceRef] | None = None,
) -> list[SentenceTimelineItem]:
    if sentence_refs:
        return _sentence_timeline_from_refs(sentence_refs, word_timeline)

    indices = _infer_sentence_word_indices(text, len(reference_tokens))
    return _sentence_timeline_from_indices(indices, word_timeline)


def _sentence_timeline_from_refs(
    refs: list[SentenceRef],
    word_timeline: list[WordTimelineItem],
) -> list[SentenceTimelineItem]:
    by_index = {item.word_index: item for item in word_timeline}
    items: list[SentenceTimelineItem] = []

    for ref in sorted(refs, key=lambda r: r.sentence_index):
        words = [
            by_index[i]
            for i in range(ref.start_word_index, ref.end_word_index + 1)
            if i in by_index
        ]
        if not words:
            continue
        items.append(
            SentenceTimelineItem(
                sentenceIndex=ref.sentence_index,
                start=words[0].start,
                end=words[-1].end,
            )
        )
    return items


def _infer_sentence_word_indices(text: str, token_count: int) -> list[int]:
    sentences = [s for s in SENTENCE_SPLIT.split(text.strip()) if s.strip()] or [text.strip()]
    indices: list[int] = []
    token_idx = 0

    for sent_idx, sentence in enumerate(sentences):
        words_in_sentence = len(re.findall(r"[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?", sentence))
        for _ in range(words_in_sentence):
            if token_idx < token_count:
                indices.append(sent_idx)
                token_idx += 1

    last = len(sentences) - 1
    while len(indices) < token_count:
        indices.append(max(last, 0))

    return indices


def _sentence_timeline_from_indices(
    sentence_word_indices: list[int],
    word_timeline: list[WordTimelineItem],
) -> list[SentenceTimelineItem]:
    groups: dict[int, list[WordTimelineItem]] = {}
    for item in word_timeline:
        sent_idx = sentence_word_indices[item.word_index] if item.word_index < len(sentence_word_indices) else 0
        groups.setdefault(sent_idx, []).append(item)

    return [
        SentenceTimelineItem(
            sentenceIndex=sent_idx,
            start=words[0].start,
            end=words[-1].end,
        )
        for sent_idx, words in sorted(groups.items(), key=lambda kv: kv[0])
        if words
    ]
