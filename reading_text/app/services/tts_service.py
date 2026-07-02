from dataclasses import dataclass
from pathlib import Path

from app.factories.provider_factory import ProviderFactory
from app.providers.base.base_tts_provider import TtsSynthesisInput


@dataclass
class TtsSynthesisResult:
    audio_path: Path
    duration: float | None


class TtsService:
    async def synthesize(
        self,
        provider_name: str,
        text: str,
        voice: str,
        speed: float = 1.0,
        pitch: float = 0.0,
        output_format: str = "mp3",
    ) -> TtsSynthesisResult:
        provider = ProviderFactory.get_tts_provider(provider_name)

        result = await provider.synthesize(
            TtsSynthesisInput(
                text=text,
                voice=voice,
                speed=speed,
                pitch=pitch,
                output_format=output_format,
            )
        )
        return TtsSynthesisResult(audio_path=result.audio_path, duration=result.duration)
