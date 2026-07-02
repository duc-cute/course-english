from fastapi import Request
from fastapi.responses import JSONResponse


class SpeechPlatformError(Exception):
    def __init__(self, message: str, status_code: int = 400, code: str = "SPEECH_ERROR"):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(message)


class ProviderNotFoundError(SpeechPlatformError):
    def __init__(self, provider: str):
        super().__init__(
            message=f"TTS provider not found: {provider}",
            status_code=404,
            code="PROVIDER_NOT_FOUND",
        )


class ProviderNotReadyError(SpeechPlatformError):
    def __init__(self, provider: str):
        super().__init__(
            message=f"TTS provider not implemented yet: {provider}",
            status_code=501,
            code="PROVIDER_NOT_READY",
        )


class UnauthorizedError(SpeechPlatformError):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message=message, status_code=401, code="UNAUTHORIZED")


class StorageError(SpeechPlatformError):
    def __init__(self, message: str):
        super().__init__(message=message, status_code=500, code="STORAGE_ERROR")


async def speech_platform_exception_handler(
    _request: Request,
    exc: SpeechPlatformError,
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "code": exc.code, "message": exc.message},
    )
