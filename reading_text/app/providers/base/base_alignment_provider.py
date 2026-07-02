from abc import ABC, abstractmethod
from pathlib import Path

from app.models.timeline import SentenceTimelineItem, WordTimelineItem
from app.utils.timeline_mapper import SentenceRef


class BaseAlignmentProvider(ABC):
    """Generate word/sentence timestamps from audio + reference text."""

    name: str

    @abstractmethod
    async def align(
        self,
        audio_path: Path,
        text: str,
        tokens: list[str] | None = None,
        sentence_refs: list[SentenceRef] | None = None,
    ) -> tuple[list[WordTimelineItem], list[SentenceTimelineItem]]:
        """Return word and sentence timelines aligned to reference tokens."""
