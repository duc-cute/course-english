import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile

from app.core.config import settings
from app.core.security import verify_api_key
from app.models.request import AlignmentRequest
from app.models.response import AlignmentResult
from app.services.alignment_service import AlignmentService
from app.utils.files import ensure_dir, safe_unlink

router = APIRouter(prefix="/alignment", tags=["Alignment"])
alignment_service = AlignmentService()


@router.post("", response_model=AlignmentResult, response_model_by_alias=True)
async def align_audio(
    body: AlignmentRequest,
    audio: UploadFile = File(...),
    _: None = Depends(verify_api_key),
) -> AlignmentResult:
    temp_dir = ensure_dir(settings.temp_dir)
    suffix = Path(audio.filename or "audio.mp3").suffix or ".mp3"
    temp_path = temp_dir / f"align-{uuid.uuid4()}{suffix}"

    try:
        temp_path.write_bytes(await audio.read())
        timeline, sentence_timeline = await alignment_service.align(
            audio_path=temp_path,
            text=body.text,
            tokens=body.tokens,
            sentence_refs=body.sentences,
            provider_name=body.provider,
        )
        return AlignmentResult(timeline=timeline, sentence_timeline=sentence_timeline)
    finally:
        safe_unlink(temp_path)
