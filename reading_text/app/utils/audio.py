import asyncio
import shutil
import subprocess
from pathlib import Path

from app.core.logger import get_logger

logger = get_logger(__name__)


def _probe_audio_duration_sync(path: Path) -> float | None:
    """Sync ffprobe call — safe on Windows SelectorEventLoop (no asyncio subprocess)."""
    proc = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        return None
    try:
        return float(proc.stdout.strip())
    except ValueError:
        return None


async def probe_audio_duration(path: Path) -> float | None:
    """Read duration in seconds via ffprobe; returns None when unavailable."""
    if not path.is_file():
        return None

    if not shutil.which("ffprobe"):
        logger.debug("ffprobe not found — duration omitted for %s", path)
        return None

    return await asyncio.to_thread(_probe_audio_duration_sync, path)
