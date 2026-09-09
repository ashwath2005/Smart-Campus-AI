"""
Rate Limiter Middleware for Smart Campus AI.

Implements a sliding window counter using deques of timestamps
to enforce per-client request rate limits.
"""

from collections import defaultdict, deque
from time import time
from typing import Tuple

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.services.auth_service import decode_token


class RateLimitStore:
    """
    In-memory rate limit store using sliding window counters.

    Uses a dictionary mapping client keys (IP or user_id) to a deque
    of request timestamps. Expired timestamps are pruned on each check,
    implementing a sliding window algorithm.
    """

    def __init__(self):
        self.requests: dict[str, deque] = defaultdict(deque)

    def is_rate_limited(
        self, key: str, max_requests: int, window_seconds: int
    ) -> Tuple[bool, int]:
        """
        Check if a client has exceeded their rate limit.

        Args:
            key: Unique identifier for the client (IP address or user ID).
            max_requests: Maximum number of requests allowed in the window.
            window_seconds: Duration of the sliding window in seconds.

        Returns:
            A tuple of (is_limited, retry_after) where:
            - is_limited: True if the client has exceeded the rate limit.
            - retry_after: Seconds until the client can make another request
              (0 if not limited).
        """
        now = time()
        window = self.requests[key]

        # Remove expired timestamps outside the current window
        while window and window[0] <= now - window_seconds:
            window.popleft()

        if len(window) >= max_requests:
            # Calculate how long until the oldest request in the window expires
            retry_after = int(window[0] + window_seconds - now) + 1
            return True, retry_after

        # Record this request
        window.append(now)
        return False, 0

    def cleanup(self, window_seconds: int) -> None:
        """
        Remove entries that have no requests within the given window.

        This prevents memory growth from clients that made requests
        long ago and never returned.

        Args:
            window_seconds: The maximum window duration to check against.
        """
        now = time()
        expired_keys = []

        for key, window in self.requests.items():
            # Prune expired timestamps
            while window and window[0] <= now - window_seconds:
                window.popleft()
            # If no timestamps remain, mark for removal
            if not window:
                expired_keys.append(key)

        for key in expired_keys:
            del self.requests[key]

    def reset(self, key: str) -> None:
        """
        Reset the rate limit counter for a specific client.

        Args:
            key: The client identifier to reset.
        """
        if key in self.requests:
            del self.requests[key]

    def get_remaining(
        self, key: str, max_requests: int, window_seconds: int
    ) -> int:
        """
        Get the number of remaining requests allowed for a client.

        Args:
            key: Unique identifier for the client.
            max_requests: Maximum number of requests allowed in the window.
            window_seconds: Duration of the sliding window in seconds.

        Returns:
            Number of requests remaining before rate limit is hit.
        """
        now = time()
        window = self.requests[key]

        # Remove expired timestamps
        while window and window[0] <= now - window_seconds:
            window.popleft()

        return max(0, max_requests - len(window))


# Default rate limit configuration
DEFAULT_MAX_REQUESTS = 200
DEFAULT_WINDOW_SECONDS = 60

# Rate limit tier configuration
# Strict tier: for authentication endpoints (brute-force protection)
STRICT_TIER = {
    "max_requests": 30,
    "window_seconds": 60,
    "key_prefix": "strict",
}

# Standard tier: for general API endpoints
STANDARD_TIER = {
    "max_requests": 200,
    "window_seconds": 60,
    "key_prefix": "standard",
}

# Path prefix that triggers the strict tier
STRICT_PATH_PREFIX = "/api/auth/"

# Module-level store instance shared across middleware
rate_limit_store = RateLimitStore()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware that enforces per-client request rate limits.

    Extracts the client identifier from the request (IP address via
    X-Forwarded-For header or direct client host) and checks the
    sliding window rate limit. Returns HTTP 429 with a JSON body
    and Retry-After header when the limit is exceeded.
    """

    async def __call__(self, scope, receive, send):
        if scope["type"] == "websocket":
            await self.app(scope, receive, send)
            return
        await super().__call__(scope, receive, send)

    def __init__(
        self,
        app,
        max_requests: int = DEFAULT_MAX_REQUESTS,
        window_seconds: int = DEFAULT_WINDOW_SECONDS,
    ):
        """
        Initialize the rate limiter middleware.

        Args:
            app: The ASGI application.
            max_requests: Maximum number of requests allowed per window.
            window_seconds: Duration of the sliding window in seconds.
        """
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.store = rate_limit_store

    def _get_client_ip(self, request: Request) -> str:
        """
        Extract the client IP address from the request.

        Checks the X-Forwarded-For header first (for reverse proxy setups),
        then falls back to the direct client host.

        Args:
            request: The incoming HTTP request.

        Returns:
            The client's IP address as a string.
        """
        # Check X-Forwarded-For header (set by reverse proxies / load balancers)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # X-Forwarded-For can contain multiple IPs; the first is the client
            return forwarded_for.split(",")[0].strip()

        # Fall back to direct client connection info
        if request.client:
            return request.client.host

        return "unknown"

    def _get_tier(self, request: Request) -> dict:
        """
        Determine the rate limit tier based on the request path.

        Auth endpoints (paths starting with /api/auth/) use the strict tier
        to protect against brute-force attacks. All other endpoints use the
        standard tier.

        Args:
            request: The incoming HTTP request.

        Returns:
            The tier configuration dictionary (STRICT_TIER or STANDARD_TIER).
        """
        path = request.url.path
        if path.startswith(STRICT_PATH_PREFIX):
            return STRICT_TIER
        return STANDARD_TIER

    def _get_client_identifier(self, request: Request) -> str:
        """
        Extract the client identifier for rate limiting.

        Tries to extract a user_id from the Authorization Bearer token
        to provide per-user rate limiting for authenticated requests.
        Falls back to IP-based identification if no valid token is present.

        Args:
            request: The incoming HTTP request.

        Returns:
            A string identifier: "user:{user_id}" for authenticated users,
            or the client IP address for unauthenticated requests.
        """
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header[7:].strip()
            if token:
                try:
                    payload = decode_token(token)
                    user_id = payload.get("user_id")
                    if user_id:
                        return f"user:{user_id}"
                except Exception:
                    # Token decode failed — fall back to IP-based limiting
                    pass

        return self._get_client_ip(request)

    async def dispatch(self, request: Request, call_next):
        """
        Process the request through rate limiting logic.

        Extracts the client identifier (user_id from Bearer token if
        available, otherwise client IP), determines the appropriate rate
        limit tier based on the request path, checks the rate limit store,
        and either allows the request to proceed or returns a 429 response.

        Auth endpoints (/api/auth/*) use the strict tier (5 req/60s).
        All other endpoints use the standard tier (60 req/60s).
        Each tier uses a separate key prefix so counters don't interfere.

        Args:
            request: The incoming HTTP request.
            call_next: The next middleware or route handler.

        Returns:
            The response from downstream or a 429 JSON response.
        """
        # Skip rate limiting for CORS preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)

        client_identifier = self._get_client_identifier(request)

        # Determine rate limit tier based on request path
        tier = self._get_tier(request)
        key_prefix = tier["key_prefix"]
        max_requests = tier["max_requests"]
        window_seconds = tier["window_seconds"]

        # Build the rate limit key with tier prefix to keep counters separate
        rate_limit_key = f"{key_prefix}:{client_identifier}"

        # Check rate limit
        is_limited, retry_after = self.store.is_rate_limited(
            key=rate_limit_key,
            max_requests=max_requests,
            window_seconds=window_seconds,
        )

        if is_limited:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "retry_after": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

        # Request is within limits — proceed
        response = await call_next(request)
        return response
