from pydantic import BaseModel, ConfigDict, Field

from app.models.timeline import SentenceTimelineItem, WordTimelineItem


class SentenceRefDTO(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    sentence_index: int = Field(alias="sentenceIndex")
    start_word_index: int = Field(alias="startWordIndex")
    end_word_index: int = Field(alias="endWordIndex")


def sentence_refs_from_dto(items: list[SentenceRefDTO] | None):
    from app.utils.timeline_mapper import SentenceRef

    if not items:
        return None
    return [
        SentenceRef(
            sentence_index=item.sentence_index,
            start_word_index=item.start_word_index,
            end_word_index=item.end_word_index,
        )
        for item in items
    ]
