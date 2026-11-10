# Container image for the PulmoScan AI API.
# Works on Render, Hugging Face Spaces (Docker SDK), Railway, Fly.io, etc.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TF_CPP_MIN_LOG_LEVEL=2 \
    PORT=7860

# Keep memory low enough for small (512 MB) instances: the model is tiny, so
# one thread is plenty, and fewer malloc arenas means less wasted memory.
ENV TF_NUM_INTRAOP_THREADS=1 \
    TF_NUM_INTEROP_THREADS=1 \
    OMP_NUM_THREADS=1 \
    MALLOC_ARENA_MAX=2

# Hugging Face Spaces runs containers as a non-root user with UID 1000.
RUN useradd --create-home --uid 1000 appuser
WORKDIR /home/appuser/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appuser . .
USER appuser

EXPOSE 7860
# Most hosts inject $PORT; Hugging Face Spaces expects 7860 (the default above).
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
