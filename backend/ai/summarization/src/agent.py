from __future__ import annotations

from .models import SummariseResponse


def _summarise_text(text: str, max_sentences: int = 3) -> SummariseResponse:
    cleaned = " ".join(text.split())
    if not cleaned:
        return SummariseResponse(summary="", bullets=[])

    sentences = [
        part.strip()
        for part in cleaned.replace("!", ".").replace("?", ".").split(".")
        if part.strip()
    ]
    selected = sentences[:max_sentences] or [cleaned]
    summary = ". ".join(selected)
    if summary and not summary.endswith("."):
        summary += "."

    return SummariseResponse(summary=summary, bullets=selected)


def summarise(text: str, max_sentences: int = 3) -> SummariseResponse:
    return _summarise_text(text, max_sentences=max_sentences)


def summarize(text: str, max_sentences: int = 3) -> SummariseResponse:
    return _summarise_text(text, max_sentences=max_sentences)


def summarise_text(text: str, max_sentences: int = 3) -> SummariseResponse:
    return _summarise_text(text, max_sentences=max_sentences)


def summarize_text(text: str, max_sentences: int = 3) -> SummariseResponse:
    return _summarise_text(text, max_sentences=max_sentences)


class SummarisationAgent:
    def summarise(self, text: str, max_sentences: int = 3) -> SummariseResponse:
        return _summarise_text(text, max_sentences=max_sentences)

    def summarize(self, text: str, max_sentences: int = 3) -> SummariseResponse:
        return _summarise_text(text, max_sentences=max_sentences)


class SummarizationAgent(SummarisationAgent):
    pass
