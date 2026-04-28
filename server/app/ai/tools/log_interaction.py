import json
import re
from typing import Any, Dict

from app.ai.llm import call_llm
from app.db.service import save_interaction


async def log_interaction(user_input: str) -> Dict[str, Any]:
    extraction_prompt = f"""
Extract structured CRM data from this interaction.

Return ONLY valid JSON with the following fields:
- hcp_name (string)
- product (string or null)
- summary (string)
- follow_up (string or null)
- sentiment (string or null)
- interaction_type (string or null)
- occurred_at (ISO 8601 string or null)

Text:
{user_input}
"""

    llm_output = await call_llm(extraction_prompt)
    structured_data = _parse_json(llm_output)
    structured_data["raw_text"] = user_input

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


def _parse_json(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return {}
        return json.loads(match.group(0))