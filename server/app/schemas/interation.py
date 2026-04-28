from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class InteractionBase(BaseModel):
	hcp_name: str
	product: Optional[str] = None
	summary: Optional[str] = None
	follow_up: Optional[str] = None
	sentiment: Optional[str] = None
	interaction_type: Optional[str] = None
	occurred_at: Optional[datetime] = None
	raw_text: Optional[str] = None


class InteractionCreate(InteractionBase):
	pass


class InteractionUpdate(BaseModel):
	hcp_name: Optional[str] = None
	product: Optional[str] = None
	summary: Optional[str] = None
	follow_up: Optional[str] = None
	sentiment: Optional[str] = None
	interaction_type: Optional[str] = None
	occurred_at: Optional[datetime] = None
	raw_text: Optional[str] = None


class InteractionOut(InteractionBase):
	id: int
	created_at: datetime

	class Config:
		from_attributes = True
