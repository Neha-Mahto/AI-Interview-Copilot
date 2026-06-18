"""
AI Interview Copilot - FastAPI Backend
Production-ready REST API with JWT auth, PostgreSQL, and OpenAI integration
"""

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time

from config import settings
from database import engine, Base
from routers import auth, interviews, questions, answers, analytics
from utils.logger import setup_logging

# ─── Logging ────────────────────────────────────────────────────────────────
setup_logging()
logger = logging.getLogger(__name__)


# ─── Lifespan ───────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting AI Interview Copilot API")
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created/verified")
    yield
    logger.info("🛑 Shutting down AI Interview Copilot API")


# ─── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Interview Copilot API",
    description="Production-ready AI-powered mock interview platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)


# ─── Middleware ──────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"{request.method} {request.url.path} - {response.status_code} ({process_time:.3f}s)")
    return response


# ─── Exception Handlers ─────────────────────────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status": "error", "code": exc.status_code},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status": "error", "code": 500},
    )


# ─── Routers ────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["Interviews"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(answers.router, prefix="/api/answers", tags=["Answers"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])


# ─── Health Check ───────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "AI Interview Copilot API",
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": "AI Interview Copilot API",
        "docs": "/api/docs",
        "health": "/health",
    }
