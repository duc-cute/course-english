import uuid

import httpx

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

ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"


class ElevenLabsTTSProvider(BaseTTSProvider):
    name = "elevenlabs"

    async def synthesize(self, request: TtsSynthesisInput) -> TtsSynthesisOutput:
        api_key = (settings.elevenlabs_api_key or "").strip()
        if not api_key:
            raise SpeechPlatformError(
                message="ELEVENLABS_API_KEY is missing",
                status_code=503,
                code="PROVIDER_NOT_READY",
            )

        voice_id = (request.voice or "").strip()
        if not voice_id:
            raise SpeechPlatformError(
                message="Voice id is required for elevenlabs provider",
                status_code=400,
                code="INVALID_REQUEST",
            )

        temp_dir = ensure_dir(settings.temp_dir)
        output_path = temp_dir / f"{uuid.uuid4()}.{request.output_format}"

        payload = {
            "text": request.text,
            "model_id": settings.elevenlabs_model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            },
        }

        headers = {
            "xi-api-key": api_key,
            "accept": "audio/mpeg",
            "content-type": "application/json",
        }

        url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{voice_id}"
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, json=payload, headers=headers)
        except Exception as exc:
            logger.exception("ElevenLabs request failed")
            raise SpeechPlatformError(
                message=f"ElevenLabs request failed: {exc}",
                status_code=502,
                code="TTS_SYNTHESIS_FAILED",
            ) from exc

        if response.status_code >= 400:
            logger.error("ElevenLabs error status=%s body=%s", response.status_code, response.text)
            raise SpeechPlatformError(
                message=f"ElevenLabs synthesis failed: HTTP {response.status_code}",
                status_code=502,
                code="TTS_SYNTHESIS_FAILED",
            )

        output_path.write_bytes(response.content)
        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise SpeechPlatformError(
                message="ElevenLabs produced an empty audio file",
                status_code=502,
                code="TTS_SYNTHESIS_FAILED",
            )

        duration = await probe_audio_duration(output_path)
        return TtsSynthesisOutput(audio_path=output_path, duration=duration)

    def list_voices(self) -> list[str]:
        api_key = (settings.elevenlabs_api_key or "").strip()
        if not api_key:
            return []
        headers = {"xi-api-key": api_key, "accept": "application/json"}
        url = f"{ELEVENLABS_BASE_URL}/voices"
        try:
            with httpx.Client(timeout=20.0) as client:
                response = client.get(url, headers=headers)
            if response.status_code >= 400:
                return []
            payload = response.json()
            voices = payload.get("voices", [])
            return [v.get("voice_id", "") for v in voices if v.get("voice_id")]
        except Exception:
            return []
