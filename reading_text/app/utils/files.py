from pathlib import Path


def ensure_dir(path: str | Path) -> Path:
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def safe_unlink(path: Path) -> None:
    if path.exists():
        path.unlink()
