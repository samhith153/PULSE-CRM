"""
RBAC Permission Registry
Defines all available permissions and their role assignments.
Used by both the seeder and the require_permission() dependency.
"""
from enum import Enum
from typing import Any, Dict, Set


class Permission(str, Enum):
    """Exhaustive list of granular permissions."""

    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    USER_MANAGE_ROLES = "user:manage_roles"
    USER_ACTIVATE = "user:activate"
    USER_DEACTIVATE = "user:deactivate"

    ORG_CREATE = "org:create"
    ORG_READ = "org:read"
    ORG_UPDATE = "org:update"
    ORG_DELETE = "org:delete"

    COMPANY_CREATE = "company:create"
    COMPANY_READ = "company:read"
    COMPANY_UPDATE = "company:update"
    COMPANY_DELETE = "company:delete"

    CONTACT_CREATE = "contact:create"
    CONTACT_READ = "contact:read"
    CONTACT_UPDATE = "contact:update"
    CONTACT_DELETE = "contact:delete"

    LEAD_CREATE = "lead:create"
    LEAD_READ = "lead:read"
    LEAD_UPDATE = "lead:update"
    LEAD_DELETE = "lead:delete"
    LEAD_ASSIGN = "lead:assign"
    LEAD_CONVERT = "lead:convert"

    DEAL_CREATE = "deal:create"
    DEAL_READ = "deal:read"
    DEAL_UPDATE = "deal:update"
    DEAL_DELETE = "deal:delete"

    PIPELINE_READ = "pipeline:read"
    PIPELINE_UPDATE = "pipeline:update"

    ACTIVITY_CREATE = "activity:create"
    ACTIVITY_READ = "activity:read"
    ACTIVITY_UPDATE = "activity:update"
    ACTIVITY_DELETE = "activity:delete"

    EMAIL_SEND = "email:send"
    EMAIL_READ = "email:read"
    EMAIL_SYNC = "email:sync"
    GMAIL_CONNECT = "gmail:connect"

    DASHBOARD_READ = "dashboard:read"

    AI_ACCESS = "ai:access"

    WEBHOOK_MANAGE = "webhook:manage"
    FILE_UPLOAD = "file:upload"

    TEAM_PERFORMANCE_VIEW = "team_performance:view"
    TEAM_PERFORMANCE_EXPORT = "team_performance:export"

    NOTIFICATION_READ = "notification:read"
    NOTIFICATION_MANAGE = "notification:manage"

    REPORT_VIEW = "report:view"
    REPORT_EXPORT = "report:export"

    SYSTEM_ADMIN = "system:admin"


class Role(str, Enum):
    """Built-in RBAC roles."""

    ADMIN = "admin"
    MANAGER = "manager"
    SALES_REP = "sales_rep"


ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.ADMIN: set(Permission),
    Role.MANAGER: {
        Permission.USER_READ,
        Permission.USER_CREATE,
        Permission.USER_UPDATE,
        Permission.USER_DELETE,
        Permission.USER_ACTIVATE,
        Permission.USER_DEACTIVATE,
        Permission.ORG_READ,
        Permission.ORG_UPDATE,
        Permission.COMPANY_CREATE,
        Permission.COMPANY_READ,
        Permission.COMPANY_UPDATE,
        Permission.COMPANY_DELETE,
        Permission.CONTACT_CREATE,
        Permission.CONTACT_READ,
        Permission.CONTACT_UPDATE,
        Permission.CONTACT_DELETE,
        Permission.LEAD_CREATE,
        Permission.LEAD_READ,
        Permission.LEAD_UPDATE,
        Permission.LEAD_DELETE,
        Permission.LEAD_ASSIGN,
        Permission.LEAD_CONVERT,
        Permission.DEAL_CREATE,
        Permission.DEAL_READ,
        Permission.DEAL_UPDATE,
        Permission.DEAL_DELETE,
        Permission.PIPELINE_READ,
        Permission.PIPELINE_UPDATE,
        Permission.ACTIVITY_CREATE,
        Permission.ACTIVITY_READ,
        Permission.ACTIVITY_UPDATE,
        Permission.ACTIVITY_DELETE,
        Permission.EMAIL_READ,
        Permission.EMAIL_SYNC,
        Permission.EMAIL_SEND,
        Permission.GMAIL_CONNECT,
        Permission.DASHBOARD_READ,
        Permission.AI_ACCESS,
        Permission.WEBHOOK_MANAGE,
        Permission.FILE_UPLOAD,
        Permission.REPORT_VIEW,
        Permission.REPORT_EXPORT,
        Permission.TEAM_PERFORMANCE_VIEW,
        Permission.TEAM_PERFORMANCE_EXPORT,
        Permission.NOTIFICATION_READ,
        Permission.NOTIFICATION_MANAGE,
    },
    Role.SALES_REP: {
        Permission.USER_READ,
        Permission.COMPANY_CREATE,
        Permission.COMPANY_READ,
        Permission.COMPANY_UPDATE,
        Permission.CONTACT_CREATE,
        Permission.CONTACT_READ,
        Permission.CONTACT_UPDATE,
        Permission.LEAD_CREATE,
        Permission.LEAD_READ,
        Permission.LEAD_UPDATE,
        Permission.LEAD_CONVERT,
        Permission.DEAL_CREATE,
        Permission.DEAL_READ,
        Permission.DEAL_UPDATE,
        Permission.PIPELINE_READ,
        Permission.ACTIVITY_CREATE,
        Permission.ACTIVITY_READ,
        Permission.ACTIVITY_UPDATE,
        Permission.ACTIVITY_DELETE,
        Permission.EMAIL_READ,
        Permission.EMAIL_SYNC,
        Permission.EMAIL_SEND,
        Permission.DASHBOARD_READ,
        Permission.FILE_UPLOAD,
        Permission.REPORT_VIEW,
        Permission.TEAM_PERFORMANCE_VIEW,
        Permission.NOTIFICATION_READ,
    },
}


def get_permissions_for_role(role: Role) -> list[str]:
    """Return list of permission strings for a given role."""
    return [p.value for p in ROLE_PERMISSIONS.get(role, set())]


def resolve_permissions_for_user(user: Any) -> list[str]:
    """
    Resolve permissions from the loaded user roles.

    Persisted role-permission assignments are the source of truth: admin edits
    to a role (including the system roles admin/manager/sales_rep) take effect
    immediately.  The built-in catalog is only a fallback for roles that have
    NO persisted permission rows at all (e.g. before the RBAC bootstrap seeds
    them), so a fresh database is still usable out of the box.
    """
    permissions: set[str] = set()

    for user_role in getattr(user, "user_roles", []) or []:
        role = getattr(user_role, "role", None)
        if not role:
            continue

        persisted = [
            getattr(role_permission.permission, "codename", None)
            for role_permission in getattr(role, "role_permissions", []) or []
            if getattr(role_permission, "permission", None)
        ]
        persisted = [c for c in persisted if c]

        if persisted:
            # Persisted assignments win — system-role edits via the admin UI
            # (add or remove) are respected instead of being silently
            # overwritten by the built-in catalog.
            permissions.update(persisted)
            continue

        role_name = getattr(role, "name", None)
        try:
            built_in_role = Role(role_name) if role_name else None
        except ValueError:
            built_in_role = None

        if built_in_role:
            permissions.update(get_permissions_for_role(built_in_role))

    return sorted(permissions)

