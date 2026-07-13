"""Uvicorn entrypoint — AI Speech Platform."""

import logging
import sys

from app.core.config import settings
from app.core.logger import setup_logging

setup_logging()

from app.main import create_app  # noqa: E402

app = create_app()

if __name__ == "__main__":
    import uvicorn

    # uvicorn reload on Windows uses SelectorEventLoop — breaks edge_tts (aiohttp) with
    # NotImplementedError. TTS also writes temp/*.mp3 which would trigger mid-request reload.
    use_reload = settings.app_debug and sys.platform != "win32"
    if settings.app_debug and sys.platform == "win32":
        logging.getLogger(__name__).warning(
            "uvicorn reload disabled on Windows — restart manually after code changes"
        )

    uvicorn_kwargs: dict = {
        "host": settings.app_host,
        "port": settings.app_port,
        "reload": use_reload,
    }
    if use_reload:
        uvicorn_kwargs["reload_dirs"] = ["app"]
        uvicorn_kwargs["reload_excludes"] = [
            "temp/*",
            "output/*",
            "**/*.mp3",
            "**/*.wav",
            "**/*.ogg",
        ]

    uvicorn.run("main:app", **uvicorn_kwargs)
