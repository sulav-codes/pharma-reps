from typing import Any, Dict

from app.ai.llm import call_llm


async def summarize_interactions(user_input: str) -> Dict[str, Any]:
	prompt = f"""
Summarize the interactions in 1 line plus 3 bullets.

Context:
{user_input}
"""

	summary = await call_llm(prompt)
	return {
		"tool_used": "summarize",
		"status": "ok",
		"data": summary,
	}
