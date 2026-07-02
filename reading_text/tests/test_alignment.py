from unittest.mock import AsyncMock

import pytest
from app.providers.faster_whisper.alignment_provider import FasterWhisperAlignmentProvider
from app.utils.timeline_mapper import TimedWord


@pytest.mark.asyncio
async def test_faster_whisper_alignment_provider_mocked(tmp_path, monkeypatch):
    audio = tmp_path / "sample.mp3"
    audio.write_bytes(b"ID3")

    monkeypatch.setattr(
        FasterWhisperAlignmentProvider,
        "_transcribe_words",
        lambda self, path: [
            TimedWord("Hello", 0.1, 0.35),
            TimedWord("world", 0.4, 0.8),
        ],
    )

    provider = FasterWhisperAlignmentProvider()
    word_timeline, sentence_timeline = await provider.align(
        audio,
        text="Hello world.",
        tokens=["Hello", "world"],
    )

    assert len(word_timeline) == 2
    assert word_timeline[0].word_index == 0
    assert word_timeline[1].word_index == 1
    assert len(sentence_timeline) == 1
    assert sentence_timeline[0].sentence_index == 0
