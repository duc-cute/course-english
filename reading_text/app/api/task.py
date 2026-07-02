from fastapi import APIRouter, Depends

from app.core.exception import ProviderNotReadyError
from app.core.security import verify_api_key
from app.models.response import TaskStatusResponse

router = APIRouter(prefix="/task", tags=["Task"])


@router.get("/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    _: None = Depends(verify_api_key),
) -> TaskStatusResponse:
    raise ProviderNotReadyError("async-task")
