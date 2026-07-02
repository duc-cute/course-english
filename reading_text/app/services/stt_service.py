from pathlib import Path

from app.factories.provider_factory import ProviderFactory


class SttService:
    async def transcribe(
        self,
        audio_path: Path,
        language: str = "en",
        provider_name: str | None = None,
    ) -> str:
        provider = ProviderFactory.get_stt_provider(provider_name or "faster-whisper")
        return await provider.transcribe(audio_path, language)
