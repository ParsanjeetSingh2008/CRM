"""Tiny in-memory sliding-window rate limiter.

Used to slow down password guessing and to cap how often one user can call
Clive (each call costs money). It is per server process: on serverless hosting
each instance keeps its own counts, which still blunts abuse but is not a hard
global limit. A shared store (e.g. Redis) would be the next step at scale.
"""

import threading
import time
from collections import defaultdict, deque

from fastapi import Request


class RateLimiter:
    def __init__(self, max_events: int, window_seconds: float):
        self.max_events = max_events
        self.window = window_seconds
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _prune(self, key: str, now: float) -> deque[float]:
        events = self._events[key]
        while events and now - events[0] > self.window:
            events.popleft()
        return events

    def allow(self, key: str) -> bool:
        """Record one event for `key`; return False if it is over the limit."""
        now = time.monotonic()
        with self._lock:
            events = self._prune(key, now)
            if len(events) >= self.max_events:
                return False
            events.append(now)
            return True

    def reset(self) -> None:
        with self._lock:
            self._events.clear()


def client_ip(request: Request) -> str:
    # Hosting platforms (e.g. Vercel) put the real client IP first in this header.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


auth_limiter = RateLimiter(max_events=10, window_seconds=5 * 60)
clive_limiter = RateLimiter(max_events=30, window_seconds=10 * 60)
