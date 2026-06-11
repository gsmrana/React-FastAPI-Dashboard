from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.async_db import DbBase


class Group(DbBase):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(String, default="", nullable=False)

    # owner — points to a user; use UUID type matching fastapi-users
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # relationships
    owner = relationship(
        "User",
        primaryjoin="User.id == foreign(Group.owner_id)",
        uselist=False,
    )
    members = relationship(
        "User",
        primaryjoin="User.group_id == Group.id",
        foreign_keys="User.group_id",
        uselist=True,
    )
