from typing import Optional
from fastapi import HTTPException
from app.models.user import User


def apply_authorized_filter(query, Model, user: User):
    if user.group_id is not None:
        return query.filter((Model.group_id == user.group_id) | (Model.created_by == user.id))
    return query.filter(Model.created_by == user.id)


def is_authorized(resource, user: User) -> bool:
    if user.group_id is not None:
        return resource.group_id == user.group_id or resource.created_by == user.id
    return resource.created_by == user.id


def resolve_group_id(schema_group_id: Optional[int], field_was_set: bool, user: User) -> Optional[int]:
    """Resolve the effective group_id for create/update operations.
    If the caller explicitly sent group_id, validate and use it;
    otherwise fall back to the user's current group.
    """
    if not field_was_set:
        return user.group_id
    # explicit null means personal (no group)
    if schema_group_id is None:
        return None
    # must match the user's own group
    if schema_group_id != user.group_id:
        raise HTTPException(status_code=403, detail="Cannot assign content to a group you do not belong to")
    return schema_group_id
