from app.models.user import User


def apply_authorized_filter(query, Model, user: User):
    if user.group_id is not None:
        return query.filter((Model.group_id == user.group_id) | (Model.created_by == user.id))
    return query.filter(Model.created_by == user.id)


def is_authorized(resource, user: User) -> bool:
    if user.group_id is not None:
        return resource.group_id == user.group_id or resource.created_by == user.id
    return resource.created_by == user.id
