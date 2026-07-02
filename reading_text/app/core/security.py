from fastapi import Request
from fastapi.security import APIKeyHeader

from app.core.config import settings
from app.core.exception import UnauthorizedError

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(request: Request) -> None:
    """Optional API key — skipped when API_KEY is not configured."""
    if not settings.api_key:
        return

    provided = request.headers.get("X-API-Key")
    if not provided or provided != settings.api_key:
        raise UnauthorizedError("Invalid or missing API key")
