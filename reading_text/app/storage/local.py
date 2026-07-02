from pathlib import Path

from app.core.config import settings
from app.storage.base import BaseStorageBackend


class LocalStorageBackend(BaseStorageBackend):
    def __init__(self, root: str | None = None) -> None:
        self.root = Path(root or settings.storage_local_root)
        self.root.mkdir(parents=True, exist_ok=True)

    async def upload(self, local_path: Path, object_key: str, content_type: str) -> str:
        dest = self.root / object_key
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(local_path.read_bytes())
        base = settings.storage_public_base_url.rstrip("/")
        return f"{base}/{object_key.replace(chr(92), '/')}"

    async def delete(self, object_key: str) -> None:
        path = self.root / object_key
        if path.exists():
            path.unlink()
