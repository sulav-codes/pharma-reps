from __future__ import annotations

from datetime import datetime
from typing import Iterable, Optional

from sqlmodel import Session, SQLModel, create_engine, select

from app.config import settings
from app.db.models import Interaction


def _normalize_database_url(url: str) -> str:
	if url.startswith("postgres://"):
		return f"postgresql://{url[len('postgres://'):]}"
	return url


def _create_engine():
	database_url = settings.database_url
	if not database_url:
		raise ValueError("SUPABASE_DATABASE_URL or DATABASE_URL must be set")
	return create_engine(_normalize_database_url(database_url))


engine = _create_engine()


def init_db() -> None:
	SQLModel.metadata.create_all(bind=engine)


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
	if not value:
		return None
	if isinstance(value, datetime):
		return value
	try:
		return datetime.fromisoformat(value)
	except ValueError:
		return None


def save_interaction(data: dict) -> Interaction:
	interaction = Interaction(
		hcp_name=str(data.get("hcp_name") or "").strip() or "Unknown",
		product=_clean_str(data.get("product")),
		summary=_clean_str(data.get("summary")),
		follow_up=_clean_str(data.get("follow_up")),
		sentiment=_clean_str(data.get("sentiment")),
		interaction_type=_clean_str(data.get("interaction_type")),
		occurred_at=_parse_datetime(data.get("occurred_at")),
		raw_text=_clean_str(data.get("raw_text")),
	)

	with Session(engine) as session:
		session.add(interaction)
		session.commit()
		session.refresh(interaction)
		return interaction


def update_interaction(interaction_id: int, updates: dict) -> Optional[Interaction]:
	with Session(engine) as session:
		interaction = session.get(Interaction, interaction_id)
		if not interaction:
			return None

		_apply_updates(interaction, updates)
		session.commit()
		session.refresh(interaction)
		return interaction


def get_interactions_by_hcp(hcp_name: str, limit: int = 20) -> Iterable[Interaction]:
	with Session(engine) as session:
		statement = (
			select(Interaction)
			.where(Interaction.hcp_name == hcp_name)
			.order_by(Interaction.created_at.desc())
			.limit(limit)
		)
		return list(session.exec(statement).all())


def _apply_updates(interaction: Interaction, updates: dict) -> None:
	for field in [
		"hcp_name",
		"product",
		"summary",
		"follow_up",
		"sentiment",
		"interaction_type",
		"raw_text",
	]:
		if field in updates and updates[field] is not None:
			setattr(interaction, field, _clean_str(updates[field]))

	if "occurred_at" in updates:
		parsed = _parse_datetime(updates.get("occurred_at"))
		if parsed:
			interaction.occurred_at = parsed


def _clean_str(value) -> Optional[str]:
	if value is None:
		return None
	text = str(value).strip()
	return text if text else None


