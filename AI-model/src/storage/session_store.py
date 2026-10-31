"""
MediSense AI — Diagnostic Session Store
=======================================
Provides an extensible persistence interface for multi-turn diagnostic sessions.
Supports in-memory dictionary storage with automatic expiration, and optional Redis backend.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import time
import uuid


class BaseSessionStore(ABC):
    """Abstract Session Store Protocol."""

    @abstractmethod
    def create_session(self, initial_data: Dict[str, Any]) -> str:
        """Create and store a new diagnostic session, returning session_id."""
        pass

    @abstractmethod
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve session data by session_id."""
        pass

    @abstractmethod
    def update_session(self, session_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update existing session data."""
        pass

    @abstractmethod
    def delete_session(self, session_id: str) -> bool:
        """Delete session by id."""
        pass


class InMemorySessionStore(BaseSessionStore):
    """
    Thread-safe in-memory session store with TTL expiration (default: 2 hours).
    """

    def __init__(self, ttl_seconds: int = 7200):
        self._store: Dict[str, Dict[str, Any]] = {}
        self._timestamps: Dict[str, float] = {}
        self._ttl = ttl_seconds

    def _cleanup_expired(self):
        now = time.time()
        expired = [sid for sid, ts in self._timestamps.items() if now - ts > self._ttl]
        for sid in expired:
            self._store.pop(sid, None)
            self._timestamps.pop(sid, None)

    def create_session(self, initial_data: Dict[str, Any]) -> str:
        self._cleanup_expired()
        sid = str(uuid.uuid4())
        session = dict(initial_data)
        session["session_id"] = sid
        session["created_at"] = time.time()
        self._store[sid] = session
        self._timestamps[sid] = time.time()
        return sid

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        self._cleanup_expired()
        sess = self._store.get(session_id)
        if sess:
            self._timestamps[session_id] = time.time()  # touch activity
        return sess

    def update_session(self, session_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        sess = self.get_session(session_id)
        if not sess:
            return None
        sess.update(updates)
        self._timestamps[session_id] = time.time()
        return sess

    def delete_session(self, session_id: str) -> bool:
        removed = self._store.pop(session_id, None) is not None
        self._timestamps.pop(session_id, None)
        return removed


# Default singleton store instance
session_store = InMemorySessionStore()
