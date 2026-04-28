from fastapi import APIRouter, HTTPException

from app.ai.agent import run_agent
from app.db.service import get_interactions_by_hcp, save_interaction
from app.schemas.interation import InteractionCreate, InteractionOut

router = APIRouter()


@router.post("/ai/chat")
async def chat(payload: dict):
    user_input = payload.get("message")
    if not user_input:
        raise HTTPException(status_code=400, detail="Missing message")
    response = await run_agent(user_input)
    return response


@router.post("/interactions", response_model=InteractionOut)
async def create_interaction(payload: InteractionCreate):
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    record = save_interaction(data)
    return record


@router.get("/interactions/{hcp_name}", response_model=list[InteractionOut])
async def get_interactions(hcp_name: str, limit: int = 20):
    records = get_interactions_by_hcp(hcp_name, limit=limit)
    return list(records)