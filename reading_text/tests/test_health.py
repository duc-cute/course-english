from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "ai-speech-platform"
    assert body["storage_backend"] == "local"
    assert "edge" in body["providers"]["tts"]
    assert "faster-whisper" in body["providers"]["alignment"]
