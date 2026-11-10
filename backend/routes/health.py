from fastapi import APIRouter

from app.schemas import HealthResponse
from app.state import state

router = APIRouter(tags=["health"])


@router.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Used by the frontend (and the hosting platform) to check the API is up."""
    return HealthResponse(
        status="ok" if state.ready else "model_not_loaded",
        model_loaded=state.ready,
        metrics_available=state.metrics is not None,
    )
