import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware

from server.redis.client import redis_lifespan
from server.routes import router

try:
    import kronicler
    KRONICLER_AVAILABLE = True
except ImportError:
    KRONICLER_AVAILABLE = False


app = FastAPI(lifespan=redis_lifespan)

FEATURES = {"GZIP": False}

if KRONICLER_AVAILABLE:
    app.add_middleware(kronicler.KroniclerMiddleware)

origins = [
    "https://cattlelog-frontend.onrender.com",
    "https://aggie-course-recommender.vercel.app",
    "https://daviscattlelog.com",
    "https://staging.daviscattlelog.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://usekronicler.com",
]

if FEATURES.get("GZIP"):
    # Compress data larger than 5kB
    # /all_courses is currently ~285 kB
    app.add_middleware(GZipMiddleware, minimum_size=5000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
