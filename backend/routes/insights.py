from fastapi import APIRouter, HTTPException

from app.state import state

router = APIRouter(tags=["model"])


@router.get("/api/model/insights")
def model_insights() -> dict:
    """Architecture, dataset and the measured metrics written by ml/evaluate.py.

    Nothing here is hard-coded: if the model has not been trained and
    evaluated, the endpoint says so instead of inventing numbers.
    """
    if state.metrics is None:
        raise HTTPException(503, "Metrics are not available yet. Train and evaluate the model first.")
    return state.metrics
