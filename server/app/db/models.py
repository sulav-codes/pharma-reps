from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Interaction(SQLModel, table=True):
	id: Optional[int] = Field(default=None, primary_key=True)
	hcp_name: str = Field(index=True)
	product: Optional[str] = None
	summary: Optional[str] = None
	follow_up: Optional[str] = None
	sentiment: Optional[str] = None
	interaction_type: Optional[str] = None
	occurred_at: Optional[datetime] = None
	raw_text: Optional[str] = None
	created_at: datetime = Field(default_factory=datetime.utcnow)