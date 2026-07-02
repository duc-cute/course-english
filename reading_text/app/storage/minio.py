import asyncio
from pathlib import Path
from urllib.parse import urljoin

from minio import Minio
from minio.error import S3Error

from app.core.config import settings
from app.core.exception import StorageError
from app.core.logger import get_logger
from app.storage.base import BaseStorageBackend

logger = get_logger(__name__)


class MinioStorageBackend(BaseStorageBackend):
    """S3-compatible storage — works with MinIO and AWS S3."""

    def __init__(
        self,
        endpoint: str | None = None,
        access_key: str | None = None,
        secret_key: str | None = None,
        bucket: str | None = None,
        secure: bool | None = None,
        public_url: str | None = None,
        region: str | None = None,
        presign_ttl_seconds: int | None = None,
    ) -> None:
        self.endpoint = endpoint or settings.minio_endpoint
        self.access_key = access_key or settings.minio_access_key
        self.secret_key = secret_key or settings.minio_secret_key
        self.bucket = bucket or settings.minio_bucket
        self.secure = settings.minio_secure if secure is None else secure
        self.public_url = (public_url or settings.minio_public_url).rstrip("/")
        self.region = region or settings.minio_region
        self.presign_ttl_seconds = presign_ttl_seconds or settings.minio_presign_ttl_seconds
        self._client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure,
            region=self.region,
        )
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        try:
            if not self._client.bucket_exists(self.bucket):
                self._client.make_bucket(self.bucket)
                logger.info("Created MinIO bucket: %s", self.bucket)
        except S3Error as exc:
            raise StorageError(f"MinIO bucket check failed: {exc}") from exc

    async def upload(self, local_path: Path, object_key: str, content_type: str) -> str:
        if not local_path.is_file():
            raise StorageError(f"Local file not found: {local_path}")

        def _put() -> None:
            self._client.fput_object(
                self.bucket,
                object_key,
                str(local_path),
                content_type=content_type,
            )

        try:
            await asyncio.to_thread(_put)
        except S3Error as exc:
            raise StorageError(f"MinIO upload failed: {exc}") from exc

        return self._build_url(object_key)

    async def delete(self, object_key: str) -> None:
        def _remove() -> None:
            self._client.remove_object(self.bucket, object_key)

        try:
            await asyncio.to_thread(_remove)
        except S3Error as exc:
            raise StorageError(f"MinIO delete failed: {exc}") from exc

    def _build_url(self, object_key: str) -> str:
        if self.public_url:
            return urljoin(f"{self.public_url}/", f"{self.bucket}/{object_key}")
        return self._client.presigned_get_object(
            self.bucket,
            object_key,
            expires=self.presign_ttl_seconds,
        )
