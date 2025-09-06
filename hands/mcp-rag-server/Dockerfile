# syntax=docker/dockerfile:1.8
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    LANG=C.UTF-8 LC_ALL=C.UTF-8

# OS deps
RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt/lists \
    apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# non-root
ARG UID=10001 GID=10001
RUN groupadd -g $GID app && useradd -m -u $UID -g $GID -s /bin/bash app

WORKDIR /app
COPY pyproject.toml uv.lock ./

# 依存だけ同期（←ここがポイント）
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-progress --no-install-project

# ここでコードを入れる
COPY src/ ./src/
COPY config/ ./config/
# COPY data/ ./data/     # 本番は通常マウント推奨
# COPY tests/ ./tests/   # ランタイム不要なら未コピーでOK

# ランタイム
ENV PATH="/app/.venv/bin:${PATH}"
RUN mkdir -p /app/logs /app/data/source /app/data/processed \
 && chown -R app:app /app
USER app

CMD ["python", "-m", "src.main"]
