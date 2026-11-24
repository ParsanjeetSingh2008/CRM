"""Collects every route module under one router mounted at /api."""

from fastapi import APIRouter

from app.api.routes import auth, clive, health, leads

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(leads.router)
api_router.include_router(clive.router)
