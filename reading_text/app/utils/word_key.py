"""Match Spring Boot StoryWordKeyUtil — lower(trim) + strip edge punctuation."""


def word_key(surface: str) -> str:
    w = surface.lower().strip()
    start = 0
    end = len(w)
    while start < end and not w[start].isalnum():
        start += 1
    while end > start and not w[end - 1].isalnum():
        end -= 1
    return w[start:end]


def extract_word_tokens(text: str) -> list[str]:
    import re

    return re.findall(r"[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?", text)
