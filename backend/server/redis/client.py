import os
from contextlib import asynccontextmanager
from fastapi import Request
import redis.asyncio as redis

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

REDIS_CACHE_ENABLED: bool = os.getenv("REDIS_CACHE_ENABLED", "true") == "true"

def _make_client():
    url = os.getenv("REDIS_URL", "")
    if not url:
        return None
    return redis.from_url(
        url,
        decode_responses=False,
        client_name="cattlelog-redis-client",
        health_check_interval=30,
        socket_connect_timeout=5,
        socket_timeout=5,
        retry_on_timeout=True,
    )

@asynccontextmanager
async def redis_lifespan(app):
    app.state.redis = None
    try:
        app.state.redis = _make_client()
        if app.state.redis:
            await app.state.redis.ping()
    except Exception:
        app.state.redis = None
    try:
        yield
    finally:
        if getattr(app.state, "redis", None):
            await app.state.redis.aclose()
            

def get_redis(request: Request):
    if not REDIS_CACHE_ENABLED:
        return None
    return getattr(request.app.state, "redis", None)
