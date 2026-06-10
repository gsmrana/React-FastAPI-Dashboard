import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.users import current_active_user
from app.db.async_db import get_async_db
from app.models.user import User
from app.models.group import Group
from app.schemas.group import (
    GroupCreate,
    GroupUpdate,
    GroupRead,
    GroupWithMembers,
    GroupInvite,
    GroupMemberRead,
)


router = APIRouter()


def _require_group(user: User) -> int:
    if user.group_id is None:
        raise HTTPException(400, "You are not a member of any group")
    return user.group_id


def _require_owner(user: User) -> int:
    group_id = _require_group(user)
    if user.group_role != "owner":
        raise HTTPException(403, "Only the group owner can perform this action")
    return group_id


async def _get_group_or_404(group_id: int, db: AsyncSession) -> Group:
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalars().first()
    if not group:
        raise HTTPException(404, f"Group {group_id} not found")
    return group


async def _build_group_with_members(group: Group, db: AsyncSession) -> GroupWithMembers:
    result = await db.execute(select(User).where(User.group_id == group.id))
    members = result.scalars().all()
    return GroupWithMembers(
        **GroupRead.model_validate(group).model_dump(),
        members=[GroupMemberRead.model_validate(m) for m in members],
    )


@router.post("/groups", response_model=GroupWithMembers, status_code=201)
async def create_group(
    body: GroupCreate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    if user.group_id is not None:
        raise HTTPException(400, "You are already a member of a group. Leave it first.")

    new_group = Group(
        name=body.name,
        description=body.description,
        owner_id=user.id,
    )
    db.add(new_group)
    await db.flush()  # get new_group.id without committing

    user.group_id = new_group.id
    user.group_role = "owner"
    await db.commit()
    await db.refresh(new_group)
    await db.refresh(user)

    return await _build_group_with_members(new_group, db)


@router.get("/groups/me", response_model=GroupWithMembers)
async def get_my_group(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    group_id = _require_group(user)
    group = await _get_group_or_404(group_id, db)
    return await _build_group_with_members(group, db)


@router.put("/groups/{group_id}", response_model=GroupWithMembers)
async def update_group(
    group_id: int,
    body: GroupUpdate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    owner_group_id = _require_owner(user)
    if owner_group_id != group_id:
        raise HTTPException(403, "You do not own this group")

    group = await _get_group_or_404(group_id, db)
    if body.name is not None:
        group.name = body.name
    if body.description is not None:
        group.description = body.description
    group.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(group)
    return await _build_group_with_members(group, db)


@router.delete("/groups/{group_id}", status_code=204)
async def delete_group(
    group_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    owner_group_id = _require_owner(user)
    if owner_group_id != group_id:
        raise HTTPException(403, "You do not own this group")

    group = await _get_group_or_404(group_id, db)

    # clear all members' group membership
    result = await db.execute(select(User).where(User.group_id == group_id))
    members = result.scalars().all()
    for member in members:
        member.group_id = None
        member.group_role = None

    await db.delete(group)
    await db.commit()


@router.post("/groups/{group_id}/invite", response_model=GroupWithMembers)
async def invite_member(
    group_id: int,
    body: GroupInvite,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    owner_group_id = _require_owner(user)
    if owner_group_id != group_id:
        raise HTTPException(403, "You do not own this group")

    group = await _get_group_or_404(group_id, db)

    result = await db.execute(select(User).where(User.email == body.email))
    invitee = result.scalars().first()
    if not invitee:
        raise HTTPException(404, f"No user found with email '{body.email}'")
    if invitee.group_id is not None:
        raise HTTPException(400, f"User '{body.email}' is already a member of a group")

    invitee.group_id = group_id
    invitee.group_role = "member"
    await db.commit()
    await db.refresh(invitee)

    return await _build_group_with_members(group, db)


@router.delete("/groups/{group_id}/members/{member_id}", response_model=GroupWithMembers)
async def remove_member(
    group_id: int,
    member_id: uuid.UUID,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    owner_group_id = _require_owner(user)
    if owner_group_id != group_id:
        raise HTTPException(403, "You do not own this group")

    if member_id == user.id:
        raise HTTPException(400, "Owner cannot remove themselves. Delete the group instead.")

    group = await _get_group_or_404(group_id, db)

    result = await db.execute(select(User).where(User.id == member_id))
    member = result.scalars().first()
    if not member or member.group_id != group_id:
        raise HTTPException(404, "Member not found in this group")

    member.group_id = None
    member.group_role = None
    await db.commit()

    return await _build_group_with_members(group, db)


@router.post("/groups/leave", status_code=204)
async def leave_group(
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    _require_group(user)
    if user.group_role == "owner":
        raise HTTPException(400, "Group owner cannot leave. Transfer ownership or delete the group.")

    user.group_id = None
    user.group_role = None
    await db.commit()
