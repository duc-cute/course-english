from app.core.config import settings
from app.storage.minio import MinioStorageBackend


class S3StorageBackend(MinioStorageBackend):
    """AWS S3 via S3-compatible client (same SDK as MinIO)."""

    def __init__(self) -> None:
        if not settings.s3_bucket or not settings.s3_access_key or not settings.s3_secret_key:
            from app.core.exception import StorageError

            raise StorageError("S3 credentials and bucket must be configured")

        endpoint = settings.s3_endpoint or f"s3.{settings.s3_region}.amazonaws.com"
        public_url = settings.s3_public_url or f"https://{settings.s3_bucket}.s3.{settings.s3_region}.amazonaws.com"

        super().__init__(
            endpoint=endpoint,
            access_key=settings.s3_access_key,
            secret_key=settings.s3_secret_key,
            bucket=settings.s3_bucket,
            secure=True,
            public_url=public_url,
            region=settings.s3_region,
        )
