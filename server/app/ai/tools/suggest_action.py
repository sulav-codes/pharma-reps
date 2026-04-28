from typing import Any, Dict

from app.ai.llm import call_llm


async def suggest_action(user_input: str) -> Dict[str, Any]:
	prompt = f"""
You are an AI CRM assistant. Suggest the next 2 actions a rep should take.

Return a short bullet list.

Context:
{user_input}
"""

	suggestion = await call_llm(prompt)
	return {
		"tool_used": "suggest_action",
		"status": "ok",
		"data": suggestion,
	}
