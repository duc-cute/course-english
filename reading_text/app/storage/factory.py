from functools import lru_cache

from app.core.config import settings
from app.core.exception import StorageError
from app.storage.azure import AzureBlobStorageBackend
from app.storage.base import BaseStorageBackend
from app.storage.local import LocalStorageBackend
from app.storage.minio import MinioStorageBackend
from app.storage.s3 import S3StorageBackend


@lru_cache
def create_storage_backend() -> BaseStorageBackend:
    backend = settings.storage_backend
    if backend == "local":
        return LocalStorageBackend()
    if backend == "minio":
        return MinioStorageBackend()
    if backend == "s3":
        return S3StorageBackend()
    if backend == "azure":
        return AzureBlobStorageBackend()
    raise StorageError(f"Unsupported storage backend: {backend}")
