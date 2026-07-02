from fastapi import APIRouter, Depends, File, UploadFile

from app.core.exception import ProviderNotReadyError
from app.core.security import verify_api_key
from app.models.request import SttTranscribeRequest

router = APIRouter(prefix="/stt", tags=["STT"])


@router.post("/transcribe")
async def transcribe(
    body: SttTranscribeRequest,
    audio: UploadFile = File(...),
    _: None = Depends(verify_api_key),
) -> dict:
    raise ProviderNotReadyError("stt")
