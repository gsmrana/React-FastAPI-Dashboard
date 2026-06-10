from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import declared_attr, relationship


class GroupMixin:
    """Mixin that adds group_id to resource models for group-based data isolation."""

    @declared_attr
    def group_id(cls):
        return Column(Integer, ForeignKey("groups.id"), nullable=True, index=True)

    @declared_attr
    def group(cls):
        return relationship(
            "Group",
            primaryjoin=f"Group.id == foreign({cls.__name__}.group_id)",
            uselist=False,
        )
