from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class InteractionBase(BaseModel):
	hcp_name: str
	topics_discussed: Optional[str] = None
	materials_shared: Optional[str] = None
	samples_distributed: Optional[str] = None
	follow_up: Optional[str] = None
	sentiment: Optional[str] = None
	interaction_type: Optional[str] = None
	occurred_at: Optional[datetime] = None
	attendees: Optional[str] = None


class InteractionCreate(InteractionBase):
	pass


class InteractionUpdate(BaseModel):
	hcp_name: Optional[str] = None
	topics_discussed: Optional[str] = None
	materials_shared: Optional[str] = None
	samples_distributed: Optional[str] = None
	follow_up: Optional[str] = None
	sentiment: Optional[str] = None
	interaction_type: Optional[str] = None
	occurred_at: Optional[datetime] = None
	attendees: Optional[str] = None


class InteractionOut(InteractionBase):
	id: int
	created_at: datetime

	class Config:
		from_attributes = True
