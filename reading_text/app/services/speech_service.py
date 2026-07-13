from app.core.config import settings
from app.core.exception import ProviderNotReadyError, SpeechPlatformError
from app.core.logger import get_logger
from app.models.request import TtsGenerateRequest
from app.models.response import SpeechResult
from app.services.alignment_service import AlignmentService
from app.services.storage_service import StorageService
from app.services.tts_service import TtsService
from app.utils.files import safe_unlink

logger = get_logger(__name__)


class SpeechService:
    """Orchestrates TTS → alignment → storage — single entry for business flow."""

    def __init__(
        self,
        tts_service: TtsService | None = None,
        alignment_service: AlignmentService | None = None,
        storage_service: StorageService | None = None,
    ) -> None:
        self._tts = tts_service or TtsService()
        self._alignment = alignment_service or AlignmentService()
        self._storage = storage_service or StorageService()

    async def generate_speech(self, request: TtsGenerateRequest) -> SpeechResult:
        provider_name = request.provider or settings.default_tts_provider
        voice = request.voice or settings.default_tts_voice
        text_len = len(request.text or "")

        logger.info(
            "[TTS] Start provider=%s voice=%s textLen=%d alignment=%s",
            provider_name,
            voice,
            text_len,
            request.alignment_provider,
        )

        try:
            synthesis = await self._tts.synthesize(
                provider_name=provider_name,
                text=request.text,
                voice=voice,
                speed=request.speed,
                pitch=request.pitch,
                output_format=request.format,
            )

            word_timeline: list = []
            sentence_timeline: list = []
            try:
                word_timeline, sentence_timeline = await self._alignment.align(
                    audio_path=synthesis.audio_path,
                    text=request.text,
                    tokens=request.tokens,
                    sentence_refs=request.sentences,
                    provider_name=request.alignment_provider,
                )
            except ProviderNotReadyError:
                logger.warning("[TTS] Alignment skipped — provider not ready")
            except SpeechPlatformError as exc:
                logger.warning(
                    "[TTS] Alignment failed (non-fatal) code=%s msg=%s",
                    exc.code,
                    exc.message,
                )
            except Exception as exc:
                logger.warning("[TTS] Alignment failed (non-fatal): %s", exc, exc_info=True)

            duration = synthesis.duration or 0.0
            if word_timeline:
                duration = max(duration, word_timeline[-1].end)

            object_key = f"tts/{synthesis.audio_path.name}"
            try:
                audio_url = await self._storage.upload_audio(synthesis.audio_path, object_key)
            finally:
                safe_unlink(synthesis.audio_path)

            logger.info(
                "[TTS] Done provider=%s voice=%s duration=%.2f words=%d audioUrl=%s",
                provider_name,
                voice,
                duration,
                len(word_timeline),
                audio_url,
            )

            return SpeechResult(
                provider=provider_name,
                voice=voice,
                duration=duration,
                audio_url=audio_url,
                timeline=word_timeline,
                sentence_timeline=sentence_timeline,
            )
        except Exception as ex:
            logger.error(
                "[TTS] Failed provider=%s voice=%s textLen=%d reason=%s",
                provider_name,
                voice,
                text_len,
                ex,
                exc_info=True,
            )
            raise
