import asyncio

from app.core.config import settings
from app.models.request import TtsGenerateRequest
from app.services.speech_service import SpeechService


async def main() -> None:
    print("alignment_enabled =", settings.alignment_enabled)
    result = await SpeechService().generate_speech(
        TtsGenerateRequest(
            text="Hello world test.",
            provider="edge",
            voice="en-US-AriaNeural",
            tokens=["Hello", "world", "test"],
        )
    )
    print("audioUrl:", result.audio_url)
    print("duration:", result.duration)
    print("timeline items:", len(result.timeline))


if __name__ == "__main__":
    asyncio.run(main())
