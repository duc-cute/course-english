import asyncio
import shutil
from pathlib import Path

from app.core.logger import get_logger

logger = get_logger(__name__)


async def probe_audio_duration(path: Path) -> float | None:
    """Read duration in seconds via ffprobe; returns None when unavailable."""
    if not path.is_file():
        return None

    if not shutil.which("ffprobe"):
        logger.debug("ffprobe not found — duration omitted for %s", path)
        return None

    proc = await asyncio.create_subprocess_exec(
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, _stderr = await proc.communicate()
    if proc.returncode != 0:
        return None

    try:
        return float(stdout.decode().strip())
    except ValueError:
        return None
