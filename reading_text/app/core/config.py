from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "ai-speech-platform"
    app_env: Literal["development", "staging", "production"] = "development"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8100
    api_v1_prefix: str = "/api/v1"

    api_key: str | None = None

    storage_backend: Literal["local", "minio", "s3", "azure"] = "local"
    storage_local_root: str = "./output"
    storage_public_base_url: str = "http://localhost:8100/files"

    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "speech-audio"
    minio_secure: bool = False
    minio_public_url: str = "http://localhost:9000"
    minio_region: str = "us-east-1"
    minio_presign_ttl_seconds: int = 7 * 24 * 3600

    s3_endpoint: str | None = None
    s3_access_key: str | None = None
    s3_secret_key: str | None = None
    s3_bucket: str | None = None
    s3_region: str = "us-east-1"
    s3_public_url: str | None = None

    redis_url: str = "redis://localhost:6379/0"

    default_tts_provider: str = "edge"
    default_tts_voice: str = "en-US-AriaNeural"
    elevenlabs_api_key: str | None = None
    elevenlabs_model_id: str = "eleven_multilingual_v2"

    alignment_enabled: bool = True
    default_alignment_provider: str = "faster-whisper"
    whisper_model_size: str = "base"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"

    temp_dir: str = "./temp"
    output_dir: str = "./output"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
