from abc import ABC, abstractmethod
from pathlib import Path


class BaseSTTProvider(ABC):
    """Speech-to-text provider interface."""

    name: str

    @abstractmethod
    async def transcribe(self, audio_path: Path, language: str = "en") -> str:
        """Return transcript text."""
