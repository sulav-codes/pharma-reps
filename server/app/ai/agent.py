from typing import Any, Optional, TypedDict

from langgraph.graph import END, StateGraph

from app.ai.llm import call_llm
from app.ai.prompts import classify_intent_prompt
from app.ai.tools.edit_interaction import edit_interaction
from app.ai.tools.get_history import get_history
from app.ai.tools.log_interaction import log_interaction
from app.ai.tools.suggest_action import suggest_action
from app.ai.tools.summarize import summarize_interactions


class AgentState(TypedDict, total=False):
    user_input: str
    intent: str
    force_intent: Optional[str]
    response: dict[str, Any]


async def run_agent(user_input: str, force_intent: Optional[str] = None):
    result = await _GRAPH.ainvoke(
        {"user_input": user_input, "force_intent": force_intent}
    )
    response = result.get("response") or {
        "status": "error",
        "message": "No response produced.",
    }
    if "intent" not in response:
        response["intent"] = result.get("intent", "unknown")
    return response


async def _classify_intent(state: AgentState) -> dict[str, Any]:
    force_intent = state.get("force_intent")
    if force_intent:
        return {"intent": _normalize_intent(force_intent)}

    intent_raw = await call_llm(classify_intent_prompt(state["user_input"]))
    return {"intent": _normalize_intent(intent_raw)}


def _route_intent(state: AgentState) -> str:
    return state.get("intent", "unknown")


async def _log_interaction_node(state: AgentState) -> dict[str, Any]:
    return {"response": await log_interaction(state["user_input"])}


async def _edit_interaction_node(state: AgentState) -> dict[str, Any]:
    return {"response": await edit_interaction(state["user_input"])}


async def _get_history_node(state: AgentState) -> dict[str, Any]:
    return {"response": await get_history(state["user_input"])}


async def _suggest_action_node(state: AgentState) -> dict[str, Any]:
    return {"response": await suggest_action(state["user_input"])}


async def _summarize_node(state: AgentState) -> dict[str, Any]:
    return {"response": await summarize_interactions(state["user_input"])}


async def _unknown_node(state: AgentState) -> dict[str, Any]:
    return {
        "response": {
            "status": "error",
            "message": "Sorry, couldn't understand.",
        }
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


def _build_graph() -> StateGraph:
    graph = StateGraph(AgentState)
    graph.add_node("classify", _classify_intent)
    graph.add_node("log_interaction", _log_interaction_node)
    graph.add_node("edit_interaction", _edit_interaction_node)
    graph.add_node("get_history", _get_history_node)
    graph.add_node("suggest_action", _suggest_action_node)
    graph.add_node("summarize", _summarize_node)
    graph.add_node("unknown", _unknown_node)
    graph.set_entry_point("classify")
    graph.add_conditional_edges(
        "classify",
        _route_intent,
        {
            "log_interaction": "log_interaction",
            "edit_interaction": "edit_interaction",
            "get_history": "get_history",
            "suggest_action": "suggest_action",
            "summarize": "summarize",
            "unknown": "unknown",
        },
    )
    graph.add_edge("log_interaction", END)
    graph.add_edge("edit_interaction", END)
    graph.add_edge("get_history", END)
    graph.add_edge("suggest_action", END)
    graph.add_edge("summarize", END)
    graph.add_edge("unknown", END)
    return graph.compile()


_GRAPH = _build_graph()