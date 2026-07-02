from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path


@dataclass
class TtsSynthesisInput:
    text: str
    voice: str
    speed: float = 1.0
    pitch: float = 0.0
    output_format: str = "mp3"


@dataclass
class TtsSynthesisOutput:
    audio_path: Path
    duration: float | None = None


class BaseTTSProvider(ABC):
    """Strategy interface — one implementation per TTS vendor."""

    name: str

    @abstractmethod
    async def synthesize(self, request: TtsSynthesisInput) -> TtsSynthesisOutput:
        """Generate audio file on disk and return path + optional duration."""

    @abstractmethod
    def list_voices(self) -> list[str]:
        """Return supported voice identifiers for this provider."""
