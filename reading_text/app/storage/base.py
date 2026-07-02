from abc import ABC, abstractmethod
from pathlib import Path


class BaseStorageBackend(ABC):
    @abstractmethod
    async def upload(self, local_path: Path, object_key: str, content_type: str) -> str:
        """Upload file and return public or signed URL."""

    @abstractmethod
    async def delete(self, object_key: str) -> None:
        pass
