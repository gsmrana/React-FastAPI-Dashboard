from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declared_attr
from sqlalchemy.orm import relationship


class AuditMixin:
    # --- TIMESTAMPS AUDIT ---
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    # --- USER AUDIT (Foreign Keys) ---
    # MUST use @declared_attr for ForeignKeys in Mixins
    # to ensures a unique constraint/relationship is created

    @declared_attr
    def created_by(cls):
        return Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    @declared_attr
    def updated_by(cls):
        return Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    @declared_attr
    def deleted_by(cls):
        return Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # --- USER AUDIT RELATIONSHIPS ---
    @declared_attr
    def creator(cls):
        return relationship(
            "User", 
            primaryjoin=f"User.id == foreign({cls.__name__}.created_by)",
            uselist=False
        )

    @declared_attr
    def updater(cls):
        return relationship(
            "User", 
            primaryjoin=f"User.id == foreign({cls.__name__}.updated_by)",
            uselist=False
        )

    @declared_attr
    def deleter(cls):
        return relationship(
            "User", 
            primaryjoin=f"User.id == foreign({cls.__name__}.deleted_by)",
            uselist=False
        )
