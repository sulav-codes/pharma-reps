import json
import re
from datetime import datetime
from typing import Any, Dict

from app.ai.llm import call_llm
from app.db.service import update_interaction

_TIME_RE = re.compile(r"\b\d{1,2}(:\d{2})?\s*(am|pm)?\b")


def _allowed_fields_from_text(text: str) -> set[str]:
    lowered = text.lower()
    allowed: set[str] = set()

    if (
        any(
            token in lowered
            for token in [
                "date",
                "time",
                "today",
                "yesterday",
                "tomorrow",
                "morning",
                "afternoon",
                "evening",
            ]
        )
        or _TIME_RE.search(lowered)
    ):
        allowed.add("occurred_at")

    if "interaction type" in lowered or any(
        token in lowered for token in ["meeting", "call", "email", "other"]
    ):
        allowed.add("interaction_type")

    if any(token in lowered for token in ["topic", "topics", "discussed"]):
        allowed.add("topics_discussed")

    if any(
        token in lowered
        for token in ["material", "materials", "brochure", "brochures"]
    ):
        allowed.add("materials_shared")

    if any(token in lowered for token in ["sample", "samples", "distributed"]):
        allowed.add("samples_distributed")

    if any(token in lowered for token in ["follow up", "follow-up", "next step"]):
        allowed.add("follow_up")

    if any(token in lowered for token in ["sentiment", "positive", "negative", "neutral"]):
        allowed.add("sentiment")

    if any(token in lowered for token in ["attendees", "attended", "met with"]):
        allowed.add("attendees")

    if any(token in lowered for token in ["hcp", "doctor", "dr."]):
        allowed.add("hcp_name")

    return allowed


async def edit_interaction(user_input: str) -> Dict[str, Any]:
    now = datetime.now()
    prompt = f"""
Extract the interaction_id and updates from the text.
Current datetime is {now.isoformat()}.

Return ONLY valid JSON with:
- interaction_id (integer)
- hcp_name (string, optional)
- topics_discussed (string or null)
- materials_shared (string or null)
- samples_distributed (string or null)
- follow_up (string or null)
- sentiment (string or null)
- interaction_type (string or null)
- occurred_at (datetime string, e.g., 'today 3pm' or ISO 8601, optional)
- attendees (string, optional)

Only include fields explicitly mentioned in the text; otherwise return null.
Convert relative date/time to an ISO 8601 occurred_at using the current datetime.

Text:
{user_input}
"""

    llm_output = await call_llm(prompt)
    payload = _parse_json(llm_output)
    interaction_id = payload.get("interaction_id")
    if not interaction_id:
        return {
            "tool_used": "edit_interaction",
            "status": "error",
            "message": "Missing interaction_id",
        }

    allowed_fields = _allowed_fields_from_text(user_input)
    updates = {
        key: value
        for key, value in payload.items()
        if key in allowed_fields and value not in (None, "", [])
    }

    if not updates:
        return {
            "tool_used": "edit_interaction",
            "status": "error",
            "message": "No updatable fields found.",
        }

    try:
        interaction_id_int = int(interaction_id)
    except (ValueError, TypeError):
        return {
            "tool_used": "edit_interaction",
            "status": "error",
            "message": "Invalid interaction_id format",
        }

    updated = update_interaction(interaction_id_int, updates)
    if not updated:
        return {"tool_used": "edit_interaction", "status": "not_found"}

    return {
        "tool_used": "edit_interaction",
        "status": "updated",
        "data": {
            "id": updated.id,
            "hcp_name": updated.hcp_name,
            "topics_discussed": updated.topics_discussed,
            "materials_shared": updated.materials_shared,
            "samples_distributed": updated.samples_distributed,
            "follow_up": updated.follow_up,
            "sentiment": updated.sentiment,
            "interaction_type": updated.interaction_type,
            "occurred_at": (
                updated.occurred_at.isoformat() if updated.occurred_at else None
            ),
            "attendees": updated.attendees,
            "created_at": updated.created_at.isoformat(),
        },
    }


def _parse_json(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return {}
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return {}

