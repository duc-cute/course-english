import pytest
from pathlib import Path

from app.core.exception import ProviderNotFoundError, ProviderNotReadyError
from app.factories.provider_factory import ProviderFactory
from app.providers.base.base_tts_provider import (
    BaseTTSProvider,
    TtsSynthesisInput,
    TtsSynthesisOutput,
)
from app.services.storage_service import StorageService
from app.storage.local import LocalStorageBackend


class _FakeTtsProvider(BaseTTSProvider):
    name = "fake"

    async def synthesize(self, request: TtsSynthesisInput) -> TtsSynthesisOutput:
        return TtsSynthesisOutput(audio_path=Path("fake.mp3"))

    def list_voices(self) -> list[str]:
        return ["fake-voice"]


@pytest.fixture
def clean_provider_registry():
    ProviderFactory.clear_registry()
    yield
    ProviderFactory.clear_registry()


@pytest.mark.asyncio
async def test_local_storage_upload_returns_public_url(tmp_path: Path) -> None:
    source = tmp_path / "clip.mp3"
    source.write_bytes(b"ID3")
    root = tmp_path / "storage"

    backend = LocalStorageBackend(root=str(root))
    service = StorageService(backend=backend)

    url = await service.upload_audio(source, "tts/demo.mp3")

    assert url.endswith("/tts/demo.mp3")
    assert (root / "tts" / "demo.mp3").read_bytes() == b"ID3"


def test_provider_factory_registers_and_caches_singleton(clean_provider_registry) -> None:
    ProviderFactory.register_tts("fake", _FakeTtsProvider)

    first = ProviderFactory.get_tts_provider("fake")
    second = ProviderFactory.get_tts_provider("fake")

    assert first is second
    assert ProviderFactory.list_tts_providers() == ["fake"]


def test_provider_factory_unknown_provider(clean_provider_registry) -> None:
    with pytest.raises(ProviderNotFoundError) as exc:
        ProviderFactory.get_tts_provider("unknown-vendor")
    assert exc.value.code == "PROVIDER_NOT_FOUND"


def test_provider_factory_known_but_not_ready(clean_provider_registry) -> None:
    with pytest.raises(ProviderNotReadyError) as exc:
        ProviderFactory.get_tts_provider("elevenlabs")
    assert exc.value.code == "PROVIDER_NOT_READY"
