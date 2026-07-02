from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.factories.provider_factory import ProviderFactory
from app.providers.base.base_tts_provider import TtsSynthesisInput
from app.providers.edge.edge_provider import EdgeTTSProvider, format_edge_pitch, format_edge_rate
from app.services.tts_service import TtsService, TtsSynthesisResult
from app.storage.local import LocalStorageBackend
from main import app

client = TestClient(app)


def test_health_registers_edge_provider() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert "edge" in body["providers"]["tts"]
    assert "faster-whisper" in body["providers"]["alignment"]


def test_edge_rate_and_pitch_format() -> None:
    assert format_edge_rate(1.0) == "+0%"
    assert format_edge_rate(1.5) == "+50%"
    assert format_edge_rate(0.5) == "-50%"
    assert format_edge_pitch(0.0) == "+0Hz"
    assert format_edge_pitch(10.0) == "+10Hz"


@pytest.mark.asyncio
async def test_edge_provider_synthesize_writes_file(tmp_path, monkeypatch):
    monkeypatch.setattr("app.providers.edge.edge_provider.settings.temp_dir", str(tmp_path))

    class FakeCommunicate:
        def __init__(self, *args, **kwargs):
            pass

        async def save(self, path: str) -> None:
            from pathlib import Path

            Path(path).write_bytes(b"ID3fake")

    monkeypatch.setattr("app.providers.edge.edge_provider.edge_tts.Communicate", FakeCommunicate)
    monkeypatch.setattr(
        "app.providers.edge.edge_provider.probe_audio_duration",
        AsyncMock(return_value=2.5),
    )

    provider = EdgeTTSProvider()
    result = await provider.synthesize(
        TtsSynthesisInput(
            text="Hello",
            voice="en-US-AriaNeural",
            speed=1.0,
            pitch=0.0,
            output_format="mp3",
        )
    )

    assert result.audio_path.exists()
    assert result.audio_path.suffix == ".mp3"
    assert result.duration == 2.5


def test_tts_generate_with_mocked_edge(tmp_path, monkeypatch):
    storage_root = tmp_path / "storage"
    monkeypatch.setattr(
        "app.services.storage_service.create_storage_backend",
        lambda: LocalStorageBackend(root=str(storage_root)),
    )
    monkeypatch.setattr("app.core.config.settings.alignment_enabled", False)

    async def fake_synthesize(self, **kwargs) -> TtsSynthesisResult:
        audio_path = tmp_path / "speech.mp3"
        audio_path.write_bytes(b"ID3test")
        return TtsSynthesisResult(audio_path=audio_path, duration=1.5)

    monkeypatch.setattr(TtsService, "synthesize", fake_synthesize)

    response = client.post(
        "/api/v1/tts/generate",
        json={
            "text": "Hello world",
            "provider": "edge",
            "voice": "en-US-AriaNeural",
            "format": "mp3",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "edge"
    assert body["voice"] == "en-US-AriaNeural"
    assert body["audioUrl"].endswith(".mp3")
    assert body["duration"] == 1.5
    assert body["timeline"] == []
    assert body["sentenceTimeline"] == []
