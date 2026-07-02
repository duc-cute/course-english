from typing import Literal

from pydantic import BaseModel, Field

from app.models.sentence_ref import SentenceRefDTO


class TtsGenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Plain text — never HTML")
    tokens: list[str] | None = Field(
        default=None,
        description="Normalized word list from Spring Boot for wordIndex mapping",
    )
    sentences: list[SentenceRefDTO] | None = Field(
        default=None,
        description="Optional sentence boundaries from Spring Boot tokens_json",
    )
    provider: str | None = Field(default=None, description="edge | azure | elevenlabs | …")
    alignment_provider: str | None = Field(default=None, description="faster-whisper | whisperx")
    voice: str | None = None
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: float = Field(default=0.0, ge=-50.0, le=50.0)
    format: Literal["mp3", "wav", "ogg"] = "mp3"


class SttTranscribeRequest(BaseModel):
    provider: str | None = None
    language: str = "en"


class AlignmentRequest(BaseModel):
    text: str = Field(..., min_length=1)
    tokens: list[str] | None = None
    sentences: list[SentenceRefDTO] | None = None
    provider: str | None = None
