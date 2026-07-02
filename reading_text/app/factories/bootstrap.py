from app.core.logger import get_logger
from app.factories.provider_factory import ProviderFactory
from app.providers.edge.edge_provider import EdgeTTSProvider
from app.providers.elevenlabs.elevenlabs_provider import ElevenLabsTTSProvider
from app.providers.faster_whisper.alignment_provider import (
    FasterWhisperAlignmentProvider,
    WhisperXAlignmentProvider,
)

logger = get_logger(__name__)


def bootstrap_providers() -> None:
    ProviderFactory.register_tts("edge", EdgeTTSProvider)
    ProviderFactory.register_tts("elevenlabs", ElevenLabsTTSProvider)
    ProviderFactory.register_alignment("faster-whisper", FasterWhisperAlignmentProvider)
    ProviderFactory.register_alignment("whisperx", WhisperXAlignmentProvider)

    registered = ProviderFactory.list_registered()
    logger.info(
        "Provider bootstrap complete — tts=%s alignment=%s stt=%s",
        registered["tts"],
        registered["alignment"],
        registered["stt"],
    )
