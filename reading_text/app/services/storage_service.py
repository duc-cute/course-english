from pathlib import Path

from app.storage.base import BaseStorageBackend
from app.storage.factory import create_storage_backend


class StorageService:
    def __init__(self, backend: BaseStorageBackend | None = None) -> None:
        self._backend = backend or create_storage_backend()

    async def upload_audio(self, local_path: Path, object_key: str, content_type: str = "audio/mpeg") -> str:
        return await self._backend.upload(local_path, object_key, content_type)

    async def delete(self, object_key: str) -> None:
        await self._backend.delete(object_key)
