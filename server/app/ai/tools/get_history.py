import json
import re
from typing import Any, Dict

from app.ai.llm import call_llm
from app.db.service import get_interactions_by_hcp


async def get_history(user_input: str) -> Dict[str, Any]:
	prompt = f"""
Extract the HCP name from the text.

Return ONLY valid JSON with:
- hcp_name (string)

Text:
{user_input}
"""

	llm_output = await call_llm(prompt)
	payload = _parse_json(llm_output)
	hcp_name = (payload.get("hcp_name") or "").strip()
	if not hcp_name:
		return {"tool_used": "get_history", "status": "error", "message": "Missing hcp_name"}

	records = get_interactions_by_hcp(hcp_name)
	return {
		"tool_used": "get_history",
		"status": "ok",
		"data": [
			{
				"id": record.id,
				"hcp_name": record.hcp_name,
				"product": record.product,
				"summary": record.summary,
				"follow_up": record.follow_up,
				"sentiment": record.sentiment,
				"interaction_type": record.interaction_type,
				"occurred_at": record.occurred_at.isoformat() if record.occurred_at else None,
				"created_at": record.created_at.isoformat(),
			}
			for record in records
		],
	}


def _parse_json(text: str) -> Dict[str, Any]:
	try:
		return json.loads(text)
	except json.JSONDecodeError:
		match = re.search(r"\{.*\}", text, re.DOTALL)
		if not match:
			return {}
		return json.loads(match.group(0))
