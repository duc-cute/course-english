from pathlib import Path

from app.core.config import settings
from app.factories.provider_factory import ProviderFactory
from app.models.timeline import SentenceTimelineItem, WordTimelineItem
from app.models.sentence_ref import sentence_refs_from_dto


class AlignmentService:
    async def align(
        self,
        audio_path: Path,
        text: str,
        tokens: list[str] | None = None,
        sentence_refs=None,
        provider_name: str | None = None,
    ) -> tuple[list[WordTimelineItem], list[SentenceTimelineItem]]:
        if not settings.alignment_enabled:
            return [], []

        provider_key = provider_name or settings.default_alignment_provider
        provider = ProviderFactory.get_alignment_provider(provider_key)
        refs = sentence_refs_from_dto(sentence_refs) if sentence_refs else None
        return await provider.align(audio_path, text, tokens, refs)
