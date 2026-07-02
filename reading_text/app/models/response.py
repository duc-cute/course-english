from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.timeline import SentenceTimelineItem, WordTimelineItem


class SpeechMetadata(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    format: str = "mp3"
    sample_rate: int | None = Field(default=None, serialization_alias="sampleRate")
    cached: bool = False
    extra: dict[str, Any] = Field(default_factory=dict)


class SpeechResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    provider: str
    voice: str
    duration: float
    audio_url: str = Field(serialization_alias="audioUrl")
    timeline: list[WordTimelineItem] = Field(default_factory=list)
    sentence_timeline: list[SentenceTimelineItem] = Field(
        default_factory=list,
        serialization_alias="sentenceTimeline",
    )
    metadata: SpeechMetadata = Field(default_factory=SpeechMetadata)


class TaskResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    task_id: str = Field(serialization_alias="taskId")
    status: str
    message: str | None = None


class TaskStatusResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    task_id: str = Field(serialization_alias="taskId")
    status: str
    result: SpeechResult | None = None
    error: str | None = None


class AlignmentResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    timeline: list[WordTimelineItem] = Field(default_factory=list)
    sentence_timeline: list[SentenceTimelineItem] = Field(
        default_factory=list,
        serialization_alias="sentenceTimeline",
    )
