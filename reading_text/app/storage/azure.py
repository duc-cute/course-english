from pathlib import Path

from app.core.exception import StorageError
from app.storage.base import BaseStorageBackend


class AzureBlobStorageBackend(BaseStorageBackend):
    """Azure Blob — future milestone."""

    async def upload(self, local_path: Path, object_key: str, content_type: str) -> str:
        raise StorageError("Azure Blob storage is not implemented yet")

    async def delete(self, object_key: str) -> None:
        raise StorageError("Azure Blob storage is not implemented yet")
