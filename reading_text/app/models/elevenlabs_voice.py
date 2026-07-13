from pydantic import BaseModel, ConfigDict, Field


class ElevenLabsVoiceItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    voice_id: str = Field(serialization_alias="voiceId")
    name: str
    category: str | None = None
    gender: str | None = None
    accent: str | None = None
    age: str | None = None
    description: str | None = None
    preview_url: str | None = Field(default=None, serialization_alias="previewUrl")
    free_api_hint: bool = Field(default=False, serialization_alias="freeApiHint")
    available_for_tiers: list[str] = Field(default_factory=list, serialization_alias="availableForTiers")


class ElevenLabsVoiceListResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    provider: str = "elevenlabs"
    source: str = "v2"
    total_count: int = Field(default=0, serialization_alias="totalCount")
    free_api_hint_count: int = Field(default=0, serialization_alias="freeApiHintCount")
    voices: list[ElevenLabsVoiceItem] = Field(default_factory=list)
