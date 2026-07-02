import asyncio
from functools import lru_cache
from pathlib import Path

from app.core.config import settings
from app.core.exception import SpeechPlatformError
from app.core.logger import get_logger
from app.models.timeline import SentenceTimelineItem, WordTimelineItem
from app.providers.base.base_alignment_provider import BaseAlignmentProvider
from app.utils.timeline_mapper import (
    SentenceRef,
    TimedWord,
    build_sentence_timeline,
    map_timed_words_to_timeline,
)
from app.utils.word_key import extract_word_tokens

logger = get_logger(__name__)


@lru_cache(maxsize=1)
def _get_whisper_model():
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise SpeechPlatformError(
            message="faster-whisper is not installed",
            status_code=501,
            code="ALIGNMENT_NOT_AVAILABLE",
        ) from exc

    return WhisperModel(
        settings.whisper_model_size,
        device=settings.whisper_device,
        compute_type=settings.whisper_compute_type,
    )


class FasterWhisperAlignmentProvider(BaseAlignmentProvider):
    name = "faster-whisper"

    async def align(
        self,
        audio_path: Path,
        text: str,
        tokens: list[str] | None = None,
        sentence_refs: list[SentenceRef] | None = None,
    ) -> tuple[list[WordTimelineItem], list[SentenceTimelineItem]]:
        reference_tokens = tokens or extract_word_tokens(text)
        if not reference_tokens:
            return [], []

        timed_words = await asyncio.to_thread(self._transcribe_words, audio_path)
        word_timeline = map_timed_words_to_timeline(reference_tokens, timed_words, text)
        sentence_timeline = build_sentence_timeline(
            reference_tokens,
            word_timeline,
            text,
            sentence_refs,
        )
        return word_timeline, sentence_timeline

    def _transcribe_words(self, audio_path: Path) -> list[TimedWord]:
        model = _get_whisper_model()
        segments, _info = model.transcribe(
            str(audio_path),
            language="en",
            word_timestamps=True,
            vad_filter=True,
        )

        timed: list[TimedWord] = []
        for segment in segments:
            if not segment.words:
                continue
            for word in segment.words:
                if word.word and word.start is not None and word.end is not None:
                    timed.append(TimedWord(text=word.word, start=word.start, end=word.end))

        if not timed:
            raise SpeechPlatformError(
                message="Alignment produced no word timestamps",
                status_code=502,
                code="ALIGNMENT_FAILED",
            )

        logger.debug("Whisper alignment extracted %d timed words", len(timed))
        return timed


class WhisperXAlignmentProvider(FasterWhisperAlignmentProvider):
    """MVP uses faster-whisper; replace with WhisperX forced alignment later."""

    name = "whisperx"
