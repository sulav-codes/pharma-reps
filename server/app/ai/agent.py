from app.ai.llm import call_llm
from app.ai.prompts import classify_intent_prompt
from app.ai.tools.edit_interaction import edit_interaction
from app.ai.tools.get_history import get_history
from app.ai.tools.log_interaction import log_interaction
from app.ai.tools.suggest_action import suggest_action
from app.ai.tools.summarize import summarize_interactions


async def run_agent(user_input: str):
    intent_raw = await call_llm(classify_intent_prompt(user_input))
    intent = _normalize_intent(intent_raw)

    if intent == "log_interaction":
        return await log_interaction(user_input)

    if intent == "edit_interaction":
        return await edit_interaction(user_input)

    if intent == "get_history":
        return await get_history(user_input)

    if intent == "suggest_action":
        return await suggest_action(user_input)

    if intent == "summarize":
        return await summarize_interactions(user_input)

    return {
        "message": "Sorry, couldn't understand.",
        "intent": intent_raw,
    }


def _normalize_intent(intent_raw: str) -> str:
    intent = (intent_raw or "").strip().lower()
    if "log" in intent:
        return "log_interaction"
    if "edit" in intent:
        return "edit_interaction"
    if "history" in intent:
        return "get_history"
    if "suggest" in intent:
        return "suggest_action"
    if "summarize" in intent:
        return "summarize"
    return "unknown"