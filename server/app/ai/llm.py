from typing import Optional

from groq import Groq
from langchain_core.messages import HumanMessage, SystemMessage

from app.config import settings


client: Optional[Groq] = None


def _get_client() -> Groq:
    global client
    if client is None:
        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is not set")
        client = Groq(api_key=settings.groq_api_key)
    return client


def _to_groq_message(message) -> dict:
    role = "user"
    content = str(getattr(message, "content", ""))
    if isinstance(message, SystemMessage):
        role = "system"
    elif isinstance(message, HumanMessage):
        role = "user"
    return {"role": role, "content": content}


async def call_llm(prompt: str, system: Optional[str] = None) -> str:
    client = _get_client()
    messages = []
    if system:
        messages.append(SystemMessage(content=system))
    messages.append(HumanMessage(content=prompt))

    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[_to_groq_message(message) for message in messages],
        temperature=0,
    )
    if not response.choices:
        return ""
    content = response.choices[0].message.content
    return content.strip() if content else ""