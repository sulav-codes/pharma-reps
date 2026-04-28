from typing import Any, Dict, Optional
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field

from app.ai.llm import call_llm
from app.db.service import save_interaction


class InteractionExtraction(BaseModel):
    hcp_name: str = Field(..., description="Healthcare professional name")
    product: Optional[str] = None
    summary: Optional[str] = None
    follow_up: Optional[str] = None
    sentiment: Optional[str] = None
    interaction_type: Optional[str] = None
    occurred_at: Optional[str] = None


async def log_interaction(user_input: str) -> Dict[str, Any]:
    parser = PydanticOutputParser(pydantic_object=InteractionExtraction)
    prompt = PromptTemplate(
        template=(
            "Extract structured CRM data from this interaction.\n"
            "{format_instructions}\n"
            "Text:\n{text}"
        ),
        input_variables=["text"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    llm_output = await call_llm(prompt.format(text=user_input))
    structured_data = _parse_with_fallback(parser, llm_output)
    structured_data["raw_text"] = user_input
    structured_data.setdefault("hcp_name", "Unknown")

    saved = save_interaction(structured_data)

    return {
        "tool_used": "log_interaction",
        "status": "saved",
        "data": {
            "id": saved.id,
            "hcp_name": saved.hcp_name,
            "product": saved.product,
            "summary": saved.summary,
            "follow_up": saved.follow_up,
            "sentiment": saved.sentiment,
            "interaction_type": saved.interaction_type,
            "occurred_at": saved.occurred_at.isoformat() if saved.occurred_at else None,
            "created_at": saved.created_at.isoformat(),
        },
    }


def _parse_with_fallback(
    parser: PydanticOutputParser, text: str
) -> Dict[str, Any]:
    parsed = parser.parse(text)
    return parsed.model_dump() if hasattr(parsed, "model_dump") else parsed.dict()