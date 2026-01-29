"""API routes package."""
from fastapi import APIRouter
from .templates import router as templates_router
from .generate import router as generate_router
from .chat import router as chat_router

api_router = APIRouter()

api_router.include_router(templates_router, prefix="/templates", tags=["templates"])
api_router.include_router(generate_router, prefix="/generations", tags=["generations"])
api_router.include_router(chat_router, prefix="/chat", tags=["chat"])

__all__ = ["api_router"]
