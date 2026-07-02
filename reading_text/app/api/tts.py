from fastapi import APIRouter, Depends, Query

from app.core.security import verify_api_key
from app.factories.provider_factory import ProviderFactory
from app.models.request import TtsGenerateRequest
from app.models.response import SpeechResult, TaskResponse
from app.providers.edge.edge_provider import EdgeTTSProvider
from app.services.speech_service import SpeechService

router = APIRouter(prefix="/tts", tags=["TTS"])
speech_service = SpeechService()


@router.post("/generate", response_model=SpeechResult, response_model_by_alias=True)
async def generate_tts(
    body: TtsGenerateRequest,
    _: None = Depends(verify_api_key),
) -> SpeechResult:
    """Sync TTS + optional alignment + upload."""
    return await speech_service.generate_speech(body)


@router.get("/voices")
async def list_voices(
    provider: str = Query(default="edge"),
    locale: str | None = Query(default="en"),
    _: None = Depends(verify_api_key),
) -> dict:
    """List voices for a registered TTS provider."""
    tts_provider = ProviderFactory.get_tts_provider(provider)
    if provider == "edge" and isinstance(tts_provider, EdgeTTSProvider):
        voices = await EdgeTTSProvider.warm_voice_cache(locale)
        return {"provider": provider, "voices": voices}
    return {"provider": provider, "voices": tts_provider.list_voices()}


@router.post("/generate-async", response_model=TaskResponse)
async def generate_tts_async(
    body: TtsGenerateRequest,
    _: None = Depends(verify_api_key),
) -> TaskResponse:
    """Placeholder — returns 501 until worker queue is wired."""
    from app.core.exception import ProviderNotReadyError

    raise ProviderNotReadyError("async-task")
