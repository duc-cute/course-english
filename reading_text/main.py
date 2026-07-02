"""Uvicorn entrypoint — AI Speech Platform."""

from app.core.config import settings
from app.core.logger import setup_logging

setup_logging()

from app.main import create_app  # noqa: E402

app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_debug,
    )
