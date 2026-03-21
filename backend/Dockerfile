# =============================================================================
# OdinRing Backend Dockerfile
# =============================================================================
# Multi-stage build. Uses a venv so Python always finds packages (user-site
# under /home/odinring/.local is unreliable for `python -m` in containers).

# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM python:3.11.9-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install into a venv (portable path; no reliance on /root/.local user-site)
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# =============================================================================
# Stage 2: Runtime
# =============================================================================
FROM python:3.11.9-slim

RUN useradd -m -u 1000 odinring

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOME=/home/odinring \
    PATH=/opt/venv/bin:$PATH \
    PORT=8000

WORKDIR /app

RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy venv from builder (owned by app user)
COPY --from=builder --chown=odinring:odinring /opt/venv /opt/venv

COPY --chown=odinring:odinring . .

USER odinring

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/status || exit 1

EXPOSE ${PORT}

CMD ["sh", "-c", "python -m uvicorn server:app --host 0.0.0.0 --port ${PORT} --workers 4"]
