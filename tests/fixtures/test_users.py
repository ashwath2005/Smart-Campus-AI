import requests
import os
from typing import Dict, Any

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
API_PREFIX = "/api"

DEMO_CREDENTIALS = {
    "student": ("student1@campus.com", "password123"),
    "faculty": ("faculty1@campus.com", "password123"),
    "hod": ("hod1@campus.com", "password123"),
    "admin": ("admin@campus.com", "password123"),
    "security": ("security@campus.com", "password123"),
    "guardian": ("guardian@campus.com", "password123"),
}

_token_cache: Dict[str, str] = {}
_user_cache: Dict[str, Dict[str, Any]] = {}

def get_auth_token(role: str = "student", force_refresh: bool = False) -> str:
    if not force_refresh and role in _token_cache:
        return _token_cache[role]

    if role not in DEMO_CREDENTIALS:
        raise ValueError(f"Unknown test role: {role}")

    email, password = DEMO_CREDENTIALS[role]
    login_url = f"{BASE_URL}{API_PREFIX}/auth/login"

    res = requests.post(login_url, json={"email": email, "password": password}, timeout=10)
    if res.status_code != 200:
        raise RuntimeError(f"Authentication failed for role '{role}': {res.status_code} - {res.text}")

    data = res.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        raise ValueError(f"No access token returned in login response for '{role}': {data}")

    _token_cache[role] = token
    _user_cache[role] = data.get("user", {})
    return token

def get_auth_headers(role: str = "student") -> Dict[str, str]:
    token = get_auth_token(role)
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

def get_user_profile(role: str = "student") -> Dict[str, Any]:
    if role not in _user_cache:
        get_auth_token(role)
    return _user_cache.get(role, {})

def authenticated_client(role: str = "student") -> requests.Session:
    session = requests.Session()
    session.headers.update(get_auth_headers(role))
    return session
