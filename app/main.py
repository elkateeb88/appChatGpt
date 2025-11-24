"""
Main FastAPI application for AI Lead Generation Platform.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time

from app.config import settings
from app.database import engine, create_tables
from app.api import leads, campaigns, enrichment, analytics

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    logger.info("Starting up AI Lead Generation Platform...")
    logger.info(f"Environment: {'Development' if settings.DEBUG else 'Production'}")

    # Create database tables
    try:
        create_tables()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")

    yield

    # Shutdown
    logger.info("Shutting down AI Lead Generation Platform...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI-powered lead generation, enrichment, and outreach automation platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors."""
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Include routers
app.include_router(
    leads.router,
    prefix="/api/leads",
    tags=["Leads"]
)

app.include_router(
    campaigns.router,
    prefix="/api/campaigns",
    tags=["Campaigns"]
)

app.include_router(
    enrichment.router,
    prefix="/api/enrichment",
    tags=["Enrichment"]
)

app.include_router(
    analytics.router,
    prefix="/api/analytics",
    tags=["Analytics"]
)


# Root endpoints
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "AI Lead Generation Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Check database connection
        from app.database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"

    try:
        # Check Redis connection
        from app.utils.cache import get_redis_client
        redis_client = get_redis_client()
        redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        redis_status = "unhealthy"

    overall_status = "healthy" if db_status == "healthy" and redis_status == "healthy" else "degraded"

    return {
        "status": overall_status,
        "database": db_status,
        "redis": redis_status,
        "version": "1.0.0"
    }


@app.get("/info")
async def info():
    """Application information."""
    return {
        "app_name": settings.APP_NAME,
        "version": "1.0.0",
        "environment": "development" if settings.DEBUG else "production",
        "features": {
            "lead_enrichment": True,
            "email_automation": True,
            "ai_agents": True,
            "crm_sync": True,
            "analytics": True,
        }
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
