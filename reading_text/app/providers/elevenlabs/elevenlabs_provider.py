import json
import uuid
from typing import Any

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
ELEVENLABS_V2_VOICES_URL = "https://api.elevenlabs.io/v2/voices"


def _is_likely_free_api_voice(raw: dict) -> bool:
    """Heuristic: premade / own cloned voices usually work on free API; library/professional often do not."""
    category = (raw.get("category") or "").lower()
    if category in ("professional", "famous", "high_quality"):
        return False
    tiers = raw.get("available_for_tiers") or []
    if isinstance(tiers, list):
        tier_names = {str(t).lower() for t in tiers}
        if tier_names and "free" not in tier_names and "starter" not in tier_names:
            if "creator" in tier_names or "pro" in tier_names or "scale" in tier_names:
                return False
    if category in ("premade", "cloned"):
        return True
    if raw.get("is_owner") is True:
        return True
    sharing = raw.get("sharing") or {}
    if isinstance(sharing, dict) and sharing.get("status") in ("copied", "enabled"):
        return True
    return category == "premade"


def _map_elevenlabs_voice(raw: dict) -> "ElevenLabsVoiceItem":
    from app.models.elevenlabs_voice import ElevenLabsVoiceItem

    labels = raw.get("labels") or {}
    if not isinstance(labels, dict):
        labels = {}
    tiers = raw.get("available_for_tiers") or []
    if not isinstance(tiers, list):
        tiers = []
    return ElevenLabsVoiceItem(
        voice_id=str(raw.get("voice_id") or ""),
        name=str(raw.get("name") or raw.get("voice_id") or ""),
        category=raw.get("category"),
        gender=labels.get("gender"),
        accent=labels.get("accent"),
        age=labels.get("age"),
        description=raw.get("description"),
        preview_url=raw.get("preview_url"),
        free_api_hint=_is_likely_free_api_voice(raw),
        available_for_tiers=[str(t) for t in tiers],
    )


def _format_elevenlabs_error(status_code: int, body: str) -> tuple[str, str | None]:
    """Parse ElevenLabs JSON error → human message + provider error code."""
    provider_code: str | None = None
    message = f"HTTP {status_code}"

    try:
        payload: dict[str, Any] = json.loads(body)
    except json.JSONDecodeError:
        snippet = (body or "").strip().replace("\n", " ")[:500]
        return (f"{message}: {snippet}" if snippet else message, None)

    detail = payload.get("detail")
    if isinstance(detail, dict):
        provider_code = detail.get("code") or detail.get("type")
        detail_msg = detail.get("message") or detail.get("status")
        request_id = detail.get("request_id")
        parts = [str(p) for p in (provider_code, detail_msg) if p]
        if request_id:
            parts.append(f"request_id={request_id}")
        if parts:
            message = f"HTTP {status_code} — " + " | ".join(parts)
    elif isinstance(detail, str) and detail.strip():
        message = f"HTTP {status_code} — {detail.strip()}"
    elif payload.get("message"):
        message = f"HTTP {status_code} — {payload['message']}"

    return message, provider_code


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
            body = response.text or ""
            err_message, provider_code = _format_elevenlabs_error(response.status_code, body)
            logger.error(
                "[TTS] ElevenLabs rejected voice=%s status=%s code=%s message=%s rawBody=%s",
                voice_id,
                response.status_code,
                provider_code,
                err_message,
                body[:2000],
            )
            raise SpeechPlatformError(
                message=f"ElevenLabs synthesis failed: {err_message}",
                status_code=502,
                code=provider_code or "TTS_SYNTHESIS_FAILED",
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

    @staticmethod
    async def fetch_voices_v2(
        *,
        free_only: bool = False,
        search: str | None = None,
        page_size: int = 100,
    ) -> "ElevenLabsVoiceListResult":
        from app.models.elevenlabs_voice import ElevenLabsVoiceItem, ElevenLabsVoiceListResult

        api_key = (settings.elevenlabs_api_key or "").strip()
        if not api_key:
            raise SpeechPlatformError(
                message="ELEVENLABS_API_KEY is missing",
                status_code=503,
                code="PROVIDER_NOT_READY",
            )

        headers = {"xi-api-key": api_key, "accept": "application/json"}
        collected: list[ElevenLabsVoiceItem] = []
        next_token: str | None = None
        total_count = 0

        async with httpx.AsyncClient(timeout=60.0) as client:
            while True:
                params: dict[str, str | int] = {"page_size": min(max(page_size, 1), 100)}
                if search and search.strip():
                    params["search"] = search.strip()
                if next_token:
                    params["next_page_token"] = next_token

                response = await client.get(ELEVENLABS_V2_VOICES_URL, headers=headers, params=params)
                if response.status_code >= 400:
                    body = response.text or ""
                    err_message, provider_code = _format_elevenlabs_error(response.status_code, body)
                    logger.error(
                        "[TTS] ElevenLabs v2 voices failed status=%s message=%s rawBody=%s",
                        response.status_code,
                        err_message,
                        body[:2000],
                    )
                    raise SpeechPlatformError(
                        message=f"ElevenLabs voices v2 failed: {err_message}",
                        status_code=502,
                        code=provider_code or "VOICES_LIST_FAILED",
                    )

                payload = response.json()
                raw_voices = payload.get("voices") or []
                if not isinstance(raw_voices, list):
                    raw_voices = []

                for raw in raw_voices:
                    if not isinstance(raw, dict):
                        continue
                    item = _map_elevenlabs_voice(raw)
                    if not item.voice_id:
                        continue
                    if free_only and not item.free_api_hint:
                        continue
                    collected.append(item)

                total_count = int(payload.get("total_count") or len(collected))
                if not payload.get("has_more"):
                    break
                next_token = payload.get("next_page_token")
                if not next_token:
                    break

        collected.sort(key=lambda v: (not v.free_api_hint, v.name.lower()))
        free_hint_count = sum(1 for v in collected if v.free_api_hint)
        logger.info(
            "[TTS] ElevenLabs v2 voices loaded total=%d shown=%d freeHint=%d freeOnly=%s",
            total_count,
            len(collected),
            free_hint_count,
            free_only,
        )
        return ElevenLabsVoiceListResult(
            total_count=total_count,
            free_api_hint_count=free_hint_count,
            voices=collected,
        )
