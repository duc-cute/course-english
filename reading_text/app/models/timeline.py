from pydantic import BaseModel, Field


class WordTimelineItem(BaseModel):
    word_index: int = Field(..., alias="wordIndex")
    word: str
    start: float
    end: float
    char_start: int | None = Field(default=None, alias="charStart")
    char_end: int | None = Field(default=None, alias="charEnd")

    model_config = {"populate_by_name": True}


class SentenceTimelineItem(BaseModel):
    sentence_index: int = Field(..., alias="sentenceIndex")
    start: float
    end: float

    model_config = {"populate_by_name": True}
