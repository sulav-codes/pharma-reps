from fastapi import APIRouter
from app.ai.agent import run_agent

router = APIRouter()

@router.post("/ai/chat")
async def chat(payload: dict):
    user_input = payload.get("message")
    response = await run_agent(user_input)
    return response