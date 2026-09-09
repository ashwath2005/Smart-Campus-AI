from collections import OrderedDict
from hashlib import sha256
import json
import time
import asyncio
from typing import Any, Callable, Awaitable


class AICache:
    def __init__(self, max_size: int = 500, default_ttl: int = 86400):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache: OrderedDict[str, tuple[float, Any]] = OrderedDict()
        self._lock = asyncio.Lock()
        self.hits = 0
        self.misses = 0

    def _make_key(self, func_name: str, params: dict) -> str:
        raw = f"{func_name}:{json.dumps(params, sort_keys=True)}"
        return sha256(raw.encode()).hexdigest()

    async def get(self, func_name: str, params: dict) -> Any | None:
        async with self._lock:
            key = self._make_key(func_name, params)
            if key in self.cache:
                expiry, value = self.cache[key]
                if time.time() < expiry:
                    self.cache.move_to_end(key)
                    self.hits += 1
                    return value
                del self.cache[key]
            self.misses += 1
            return None

    async def set(self, func_name: str, params: dict, value: Any):
        async with self._lock:
            key = self._make_key(func_name, params)
            if key in self.cache:
                del self.cache[key]
            elif len(self.cache) >= self.max_size:
                self.cache.popitem(last=False)  # Remove LRU entry
            self.cache[key] = (time.time() + self.default_ttl, value)

    async def clear(self):
        async with self._lock:
            self.cache.clear()
            self.hits = 0
            self.misses = 0

    def get_stats(self) -> dict:
        return {
            "hits": self.hits,
            "misses": self.misses,
            "size": len(self.cache),
            "max_size": self.max_size,
        }


# Module-level singleton
ai_cache = AICache()


async def cached_ai_call(
    func_name: str,
    params: dict,
    call: Callable[[], Awaitable[Any]],
) -> Any:
    """Check cache first; on miss, invoke `call()`, store and return result."""
    cached = await ai_cache.get(func_name, params)
    if cached is not None:
        return cached
    result = await call()
    await ai_cache.set(func_name, params, result)
    return result
