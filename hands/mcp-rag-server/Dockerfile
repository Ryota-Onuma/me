# syntax=docker/dockerfile:1.8
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    LANG=C.UTF-8 LC_ALL=C.UTF-8

RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt/lists \
    apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

ARG UID=10001 GID=10001
RUN groupadd -g $GID app && useradd -m -u $UID -g $GID -s /bin/bash app

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen --no-dev --no-progress --no-install-project

ENV PATH="/app/.venv/bin:${PATH}"

ARG EMBEDDING_MODEL=intfloat/multilingual-e5-large
ENV EMBEDDING_MODEL=${EMBEDDING_MODEL} \
    HF_HOME=/opt/models \
    TRANSFORMERS_CACHE=/opt/models/hub \
    HF_HUB_DISABLE_TELEMETRY=1

RUN mkdir -p /opt/models \
 && python - <<'PY'
import os
from sentence_transformers import SentenceTransformer
SentenceTransformer(os.environ.get('EMBEDDING_MODEL', 'intfloat/multilingual-e5-large'))
PY

COPY src/ ./src/
COPY config/ ./config/

RUN mkdir -p /app/logs /app/data/source /app/data/processed /opt/models \
 && chown -R app:app /app \
 && chown -R app:app /opt/models
USER app

CMD ["python", "-m", "src.main"]
