"""
Application-wide constants
"""

# Pagination
DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Token types
ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"

# String lengths
MAX_NAME_LENGTH = 255
MAX_EMAIL_LENGTH = 255
MAX_PHONE_LENGTH = 30
MAX_URL_LENGTH = 500
MAX_SLUG_LENGTH = 100

# Lead FSM terminal states
TERMINAL_LEAD_STATUSES = {"won", "lost"}

# Roles
ROLE_ADMIN = "admin"
ROLE_MANAGER = "manager"
ROLE_SALES_REP = "sales_rep"

# Currency
DEFAULT_CURRENCY = "USD"

# Timezone
DEFAULT_TIMEZONE = "UTC"
DEFAULT_LOCALE = "en"
