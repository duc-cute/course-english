import hashlib
import json
from typing import Any


def cache_key(*parts: Any) -> str:
    """SHA256 cache key from normalized request parts."""
    payload = json.dumps(parts, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
