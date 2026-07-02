import uuid

import edge_tts

from app.core.config import settings
from app.core.exception import SpeechPlatformError
from app.core.logger import get_logger
from app.providers.base.base_tts_provider import (
    BaseTTSProvider,
    TtsSynthesisInput,
    TtsSynthesisOutput,
)
from app.utils.audio import probe_audio_duration
from app.utils.files import ensure_dir

logger = get_logger(__name__)

_voice_cache: list[str] | None = None


def format_edge_rate(speed: float) -> str:
    percent = (speed - 1.0) * 100.0
    clamped = max(-50.0, min(100.0, percent))
    return f"{clamped:+.0f}%"


def format_edge_pitch(pitch: float) -> str:
    clamped = max(-50.0, min(50.0, pitch))
    return f"{clamped:+.0f}Hz"


class EdgeTTSProvider(BaseTTSProvider):
    name = "edge"

    async def synthesize(self, request: TtsSynthesisInput) -> TtsSynthesisOutput:
        temp_dir = ensure_dir(settings.temp_dir)
        output_path = temp_dir / f"{uuid.uuid4()}.{request.output_format}"

        communicate = edge_tts.Communicate(
            text=request.text,
            voice=request.voice,
            rate=format_edge_rate(request.speed),
            pitch=format_edge_pitch(request.pitch),
        )

        try:
            await communicate.save(str(output_path))
        except Exception as exc:
            logger.exception("Edge TTS synthesis failed")
            raise SpeechPlatformError(
                message=f"Edge TTS failed: {exc}",
                status_code=502,
                code="TTS_SYNTHESIS_FAILED",
            ) from exc

        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise SpeechPlatformError(
                message="Edge TTS produced an empty audio file",
                status_code=502,
                code="TTS_SYNTHESIS_FAILED",
            )

        duration = await probe_audio_duration(output_path)
        return TtsSynthesisOutput(audio_path=output_path, duration=duration)

    def list_voices(self) -> list[str]:
        if _voice_cache:
            return list(_voice_cache)
        return [settings.default_tts_voice]

    @staticmethod
    async def fetch_voices(locale_prefix: str | None = None) -> list[dict]:
        voices = await edge_tts.list_voices()
        if locale_prefix:
            prefix = locale_prefix.lower()
            voices = [v for v in voices if v.get("Locale", "").lower().startswith(prefix)]
        return voices

    @staticmethod
    async def warm_voice_cache(locale_prefix: str | None = "en") -> list[str]:
        global _voice_cache
        voices = await EdgeTTSProvider.fetch_voices(locale_prefix)
        _voice_cache = [v["ShortName"] for v in voices if v.get("ShortName")]
        return list(_voice_cache)
