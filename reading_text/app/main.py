from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api import alignment, stt, task, tts
from app.core.config import settings
from app.core.exception import SpeechPlatformError, speech_platform_exception_handler
from app.core.logger import get_logger
from app.factories.bootstrap import bootstrap_providers
from app.utils.files import ensure_dir


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.4.0",
        description="AI Speech Platform — TTS, STT, alignment for Course English",
        docs_url="/docs" if settings.app_debug else None,
        redoc_url="/redoc" if settings.app_debug else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.app_debug else [],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(SpeechPlatformError, speech_platform_exception_handler)

    log = get_logger(__name__)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_request, exc: Exception) -> JSONResponse:
        log.exception("Unhandled speech platform error")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "code": "INTERNAL_ERROR",
                "message": str(exc) or exc.__class__.__name__,
            },
        )

    if settings.storage_backend == "local":
        root = ensure_dir(settings.storage_local_root)
        app.mount("/files", StaticFiles(directory=str(root)), name="files")

    prefix = settings.api_v1_prefix
    app.include_router(tts.router, prefix=prefix)
    app.include_router(stt.router, prefix=prefix)
    app.include_router(alignment.router, prefix=prefix)
    app.include_router(task.router, prefix=prefix)

    @app.get("/health")
    async def health() -> dict:
        from app.factories.provider_factory import ProviderFactory

        return {
            "status": "ok",
            "service": settings.app_name,
            "env": settings.app_env,
            "storage_backend": settings.storage_backend,
            "alignment_enabled": settings.alignment_enabled,
            "providers": ProviderFactory.list_registered(),
        }

    bootstrap_providers()
    return app
