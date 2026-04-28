import time
from typing import Optional

from groq import Groq

from app.config import settings


_client: Optional[Groq] = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is not set")
        _client = Groq(api_key=settings.groq_api_key)
    return _client


async def call_llm(prompt: str, system: Optional[str] = None) -> str:
    client = _get_client()
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    last_error = None
    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model=settings.groq_model,
                messages=messages,
                temperature=0,
            )
            return response.choices[0].message.content.strip()
        except Exception as exc:  # pragma: no cover - MVP safety net
            last_error = exc
            time.sleep(0.5)

    raise RuntimeError(f"LLM call failed: {last_error}")
