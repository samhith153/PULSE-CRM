"""
API v1 Router
Aggregates all domain routers under /api/v1.
"""
from __future__ import annotations

from typing import Any, Callable, Sequence

from fastapi import APIRouter
from starlette.routing import Router as StarletteRouter

# FastAPI 0.115.x expects router startup/shutdown attributes, while the
# installed Starlette router constructor does not accept those keywords.
# This compatibility shim keeps router imports and include_router() working.
if not getattr(StarletteRouter.__init__, "__pulse_compat__", False):
    _starlette_router_init = StarletteRouter.__init__

    def _compat_router_init(
        self,
        routes: Sequence[Any] | None = None,
        redirect_slashes: bool = True,
        default: Any | None = None,
        lifespan: Any | None = None,
        *,
        middleware: Sequence[Any] | None = None,
        on_startup: Sequence[Callable[[], Any]] | None = None,
        on_shutdown: Sequence[Callable[[], Any]] | None = None,
        **kwargs: Any,
    ) -> None:
        _starlette_router_init(
            self,
            routes=routes,
            redirect_slashes=redirect_slashes,
            default=default,
            lifespan=lifespan,
            middleware=middleware,
            **kwargs,
        )
        # Recreate the older FastAPI router attributes that include_router reads.
        self.on_startup = list(on_startup or [])
        self.on_shutdown = list(on_shutdown or [])

    _compat_router_init.__pulse_compat__ = True  # type: ignore[attr-defined]
    StarletteRouter.__init__ = _compat_router_init  # type: ignore[assignment]

# Keep APIRouter instances compatible with older include_router expectations.
if not hasattr(APIRouter, "on_startup"):
    APIRouter.on_startup = []  # type: ignore[attr-defined]
if not hasattr(APIRouter, "on_shutdown"):
    APIRouter.on_shutdown = []  # type: ignore[attr-defined]

from app.api.v1.activities import router as activities_router
from app.api.v1.ai import router as ai_router
from app.api.v1.auth import router as auth_router
from app.api.v1.activity import router as activity_router
from app.api.v1.companies import router as companies_router
from app.api.v1.contacts import router as contacts_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.deals import router as deals_router
from app.api.v1.emails import router as emails_router
from app.api.v1.events import router as events_router
from app.api.v1.gmail import router as gmail_router
from app.api.v1.health import router as health_router
from app.api.v1.leads import router as leads_router
from app.api.v1.organizations import router as orgs_router
from app.api.v1.pipeline import router as pipeline_router
from app.api.v1.timeline import router as timeline_router
from app.api.v1.users import router as users_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(orgs_router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(companies_router, prefix="/companies", tags=["Companies"])
api_router.include_router(contacts_router, prefix="/contacts", tags=["Contacts"])
api_router.include_router(leads_router, prefix="/leads", tags=["Leads"])
api_router.include_router(deals_router, prefix="/deals", tags=["Deals"])
api_router.include_router(activity_router, prefix="/activity", tags=["Activity"])
api_router.include_router(activities_router, prefix="/activities", tags=["Activities"])
api_router.include_router(timeline_router, prefix="/timeline", tags=["Timeline"])
api_router.include_router(pipeline_router, prefix="/pipeline", tags=["Pipeline"])
api_router.include_router(gmail_router, prefix="/gmail", tags=["Gmail"])
api_router.include_router(emails_router, prefix="/emails", tags=["Emails"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI"])
api_router.include_router(events_router, prefix="/events", tags=["Events"])
