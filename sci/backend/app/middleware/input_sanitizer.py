"""
Input Sanitization and Upload Size Validation Middleware.

Provides:
- sanitize_text(): Strips dangerous HTML content (script tags, iframes, event handlers, javascript: URIs)
- UploadSizeMiddleware: Rejects file uploads exceeding MAX_UPLOAD_SIZE (10MB) with HTTP 413
- SanitizedModel: Pydantic base model that auto-sanitizes string fields and enforces max lengths
"""

import re
from typing import Any
from fastapi import Request, Response
from pydantic import BaseModel, model_validator
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Maximum upload size: 10MB
MAX_UPLOAD_SIZE = 10 * 1024 * 1024

# Patterns for dangerous HTML/JS content
DANGEROUS_PATTERNS = [
    re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
    re.compile(r'<iframe[^>]*>.*?</iframe>', re.IGNORECASE | re.DOTALL),
    re.compile(r'on\w+\s*=\s*"[^"]*"', re.IGNORECASE),
    re.compile(r"on\w+\s*=\s*'[^']*'", re.IGNORECASE),
    re.compile(r'javascript:', re.IGNORECASE),
]


def sanitize_text(text: str) -> str:
    """
    Strip dangerous HTML content from text input.

    Removes:
    - <script>...</script> tags and their content
    - <iframe>...</iframe> tags and their content
    - Inline event handlers (onclick, onload, onerror, etc.)
    - javascript: URI schemes

    Args:
        text: The input text to sanitize.

    Returns:
        The sanitized text with dangerous patterns removed and whitespace trimmed.
    """
    if not isinstance(text, str):
        return text
    for pattern in DANGEROUS_PATTERNS:
        text = pattern.sub('', text)
    return text.strip()


# Max length limits for common field name patterns
FIELD_MAX_LENGTHS = {
    "name": 255,
    "title": 255,
    "description": 1000,
    "content": 50000,
    "body": 50000,
}


class SanitizedModel(BaseModel):
    """
    Pydantic base model that auto-sanitizes all string fields using sanitize_text()
    and enforces max length limits based on field name patterns.

    Max length rules (truncates rather than raising errors):
    - Fields containing 'name' or 'title': 255 characters
    - Fields containing 'description': 1000 characters
    - Fields containing 'content' or 'body': 50000 characters

    Usage:
        class CreatePostRequest(SanitizedModel):
            title: str
            body: str
            course_tag: str
    """

    @model_validator(mode="before")
    @classmethod
    def sanitize_and_enforce_lengths(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for field_name, value in data.items():
                if isinstance(value, str):
                    # Sanitize the text
                    value = sanitize_text(value)
                    # Enforce max length by truncation
                    max_len = _get_max_length(field_name)
                    if max_len and len(value) > max_len:
                        value = value[:max_len]
                    data[field_name] = value
        return data


def _get_max_length(field_name: str) -> int | None:
    """
    Determine max length for a field based on its name.
    Returns None if no specific limit applies.
    """
    field_lower = field_name.lower()
    for pattern, max_len in FIELD_MAX_LENGTHS.items():
        if pattern in field_lower:
            return max_len
    return None


class UploadSizeMiddleware(BaseHTTPMiddleware):
    """
    Middleware that checks the Content-Length header on incoming requests
    and rejects uploads exceeding MAX_UPLOAD_SIZE (10MB) with HTTP 413.
    """

    async def __call__(self, scope, receive, send):
        if scope["type"] == "websocket":
            await self.app(scope, receive, send)
            return
        await super().__call__(scope, receive, send)

    async def dispatch(self, request: Request, call_next) -> Response:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > MAX_UPLOAD_SIZE:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": f"Request body too large. Maximum allowed size is {MAX_UPLOAD_SIZE // (1024 * 1024)}MB."
                        },
                    )
            except (ValueError, TypeError):
                # If content-length is not a valid integer, let the request through
                pass

        response = await call_next(request)
        return response
