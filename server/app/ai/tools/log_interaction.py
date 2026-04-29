from __future__ import annotations

import json
import logging
import re
from datetime import datetime
from typing import Any, Dict, Optional

from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field, field_validator

from app.ai.llm import call_llm
from app.db.service import save_interaction

logger = logging.getLogger(__name__)


class InteractionExtraction(BaseModel):
    hcp_name: Optional[str] = Field(None, description="Healthcare professional name")
    topics_discussed: Optional[str] = Field(
        None, description="Topics discussed during the interaction"
    )
    materials_shared: Optional[str] = Field(
        None, description="Materials shared with the HCP"
    )
    samples_distributed: Optional[str] = Field(
        None, description="Samples distributed during the interaction"
    )
    follow_up: Optional[str] = None
    sentiment: Optional[str] = None
    interaction_type: Optional[str] = None
    occurred_at: Optional[str] = Field(
        None,
        description="Datetime of interaction in ISO 8601 format",
    )
    attendees: Optional[str] = Field(
        None, description="Comma-separated list of attendees"
    )

    @field_validator(
        "topics_discussed",
        "materials_shared",
        "samples_distributed",
        "follow_up",
        "attendees",
        "interaction_type",
        "hcp_name",
        "sentiment",
        "occurred_at",
        mode="before",
    )
    @classmethod
    def coerce_list_to_str(cls, v: object) -> Optional[str]:
        if isinstance(v, list):
            return ", ".join(str(item) for item in v if item is not None)
        return v  


async def log_interaction(user_input: str) -> Dict[str, Any]:
    parser = PydanticOutputParser(pydantic_object=InteractionExtraction)
    now = datetime.now()

    prompt = PromptTemplate(
        template=(
            "Extract structured CRM data from this pharma rep interaction note.\n"
            "Current datetime: {now}\n\n"
            "Rules:\n"
            "- All field values must be plain strings or null — NEVER arrays or lists.\n"
            "- If multiple values exist for a field, join them with a comma.\n"
            "- Use ISO 8601 for occurred_at; resolve relative dates using the current datetime.\n"
            "- topics_discussed: concise summary of topics, comma-separated if multiple.\n"
            "- If a field has no information, set it to null.\n\n"
            "{format_instructions}\n\n"
            "Interaction note:\n{text}"
        ),
        input_variables=["text"],
        partial_variables={
            "format_instructions": parser.get_format_instructions(),
            "now": now.isoformat(),
        },
    )

    llm_output = await call_llm(prompt.format(text=user_input))
    structured_data = _parse_with_fallback(parser, llm_output)

    # Ensure hcp_name always has a value
    if not structured_data.get("hcp_name"):
        structured_data["hcp_name"] = "Unknown"

    saved = save_interaction(structured_data)

    return {
        "tool_used": "log_interaction",
        "status": "saved",
        "data": {
            "id": saved.id,
            "hcp_name": saved.hcp_name,
            "topics_discussed": saved.topics_discussed,
            "materials_shared": saved.materials_shared,
            "samples_distributed": saved.samples_distributed,
            "follow_up": saved.follow_up,
            "sentiment": saved.sentiment,
            "interaction_type": saved.interaction_type,
            "occurred_at": (
                saved.occurred_at.isoformat() if saved.occurred_at else None
            ),
            "attendees": saved.attendees,
            "created_at": saved.created_at.isoformat(),
        },
    }


def _parse_with_fallback(
    parser: PydanticOutputParser,
    text: str,
) -> Dict[str, Any]:
    try:
        parsed = parser.parse(text)
        return parsed.model_dump()
    except Exception as e:
        logger.warning("Direct parse failed: %s", e)

    try:
        cleaned = text.strip()
        cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"```$", "", cleaned, flags=re.MULTILINE)
        cleaned = cleaned.strip()
        parsed = parser.parse(cleaned)
        return parsed.model_dump()
    except Exception as e:
        logger.warning("Markdown-stripped parse failed: %s", e)

    try:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            raw = json.loads(match.group())
            # Run through model so field_validators (list→str) are applied
            validated = InteractionExtraction.model_validate(raw)
            return validated.model_dump()
    except Exception as e:
        logger.warning("Regex JSON extraction failed: %s", e)

    logger.error(
        "All parse attempts failed for LLM output:\n%s\nReturning empty model.",
        text,
    )
    return InteractionExtraction().model_dump()