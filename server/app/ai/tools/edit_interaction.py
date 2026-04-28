import json
import re
from typing import Any, Dict

from app.ai.llm import call_llm
from app.db.service import update_interaction


async def edit_interaction(user_input: str) -> Dict[str, Any]:
	prompt = f"""
Extract the interaction_id and updates from the text.

Return ONLY valid JSON with:
- interaction_id (integer)
- hcp_name (string, optional)
- product (string or null)
- summary (string or null)
- follow_up (string or null)
- sentiment (string or null)
- interaction_type (string or null)
- occurred_at (ISO 8601 string or null)

Text:
{user_input}
"""

	llm_output = await call_llm(prompt)
	payload = _parse_json(llm_output)
	interaction_id = payload.get("interaction_id")
	if not interaction_id:
		return {"tool_used": "edit_interaction", "status": "error", "message": "Missing interaction_id"}

	updated = update_interaction(int(interaction_id), payload)
	if not updated:
		return {"tool_used": "edit_interaction", "status": "not_found"}

	return {
		"tool_used": "edit_interaction",
		"status": "updated",
		"data": {
			"id": updated.id,
			"hcp_name": updated.hcp_name,
			"product": updated.product,
			"summary": updated.summary,
			"follow_up": updated.follow_up,
			"sentiment": updated.sentiment,
			"interaction_type": updated.interaction_type,
			"occurred_at": updated.occurred_at.isoformat() if updated.occurred_at else None,
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
		return json.loads(match.group(0))
