"""PulmoScan AI - FastAPI backend.

Run locally (from the backend/ folder):
    uvicorn main:app --reload --port 8000
Interactive API docs: http://localhost:8000/docs
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.state import state
from routes import health, insights, predict

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    state.load()  # load the CNN once, when the server starts
    yield


app = FastAPI(
    title="PulmoScan AI API",
    description="CNN-based pneumonia detection from chest X-rays with Grad-CAM explanations. "
    + config.DISCLAIMER,
    version="1.0.0",
    lifespan=lifespan,
)

# CORS: browsers block a page on one origin (the Netlify site) from calling an
# API on another origin unless the API explicitly allows that origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_origin_regex=config.ALLOWED_ORIGIN_REGEX,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(predict.router)
app.include_router(insights.router)


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"service": "PulmoScan AI API", "docs": "/docs", "health": "/api/health"}
