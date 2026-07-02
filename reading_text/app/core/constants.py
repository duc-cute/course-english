"""Known provider identifiers — registration fills the factory at runtime."""

TTS_PROVIDERS = frozenset({
    "edge",
    "elevenlabs",
    "azure",
    "google",
    "openai",
    "cartesia",
    "playht",
    "f5tts",
    "cosyvoice",
})

ALIGNMENT_PROVIDERS = frozenset({
    "whisperx",
    "faster-whisper",
})

STT_PROVIDERS = frozenset({
    "faster-whisper",
    "whisperx",
})
