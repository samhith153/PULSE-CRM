"""Shared helpers for the backend test suite."""
from typing import Optional
from uuid import UUID

DEFAULT_PASSWORD = "StrongPass1!"


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def register_org(client, name: str, email: str, password: str = DEFAULT_PASSWORD) -> dict[str, str]:
    """Register a new organization + admin, returns {access, refresh} tokens."""
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": name.split()[0],
            "password": password,
            "organization_name": name,
        },
    )
    assert res.status_code == 201, f"register failed: {res.status_code} {res.text}"
    data = res.json()["data"]
    return {"access": data["access_token"], "refresh": data["refresh_token"]}


async def get_org_id(client, access_token: str) -> UUID:
    res = await client.get("/api/v1/auth/me", headers=auth_headers(access_token))
    assert res.status_code == 200, res.text
    return UUID(res.json()["data"]["organization_id"])


async def seed_user(
    db,
    *,
    email: str,
    full_name: str,
    org_id: UUID,
    role_name: str,
    password: str = DEFAULT_PASSWORD,
):
    """Create a user with a role directly in the DB (fast, reliable seeding)."""
    from app.core.security import hash_password
    from app.repositories.role_repository import RoleRepository
    from app.repositories.user_repository import UserRepository

    user_repo = UserRepository(db)
    user = await user_repo.create(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        organization_id=org_id,
        is_verified=True,
        is_active=True,
    )
    role = await RoleRepository(db).get_by_name(role_name)
    if role:
        await user_repo.assign_role(user, role.id, user.id)
    return user


async def login(client, email: str, password: str = DEFAULT_PASSWORD) -> dict[str, str]:
    res = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"login failed: {res.status_code} {res.text}"
    data = res.json()["data"]
    return {"access": data["access_token"], "refresh": data["refresh_token"]}
