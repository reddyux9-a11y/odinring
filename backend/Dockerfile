# =============================================================================
# OdinRing Backend Dockerfile
# =============================================================================
# Multi-stage build for optimal image size and security

# =============================================================================
# Stage 1: Builder
# =============================================================================
# SECURITY: Pin base image to specific version for supply chain security
FROM python:3.11.9-slim as builder

# Set working directory
WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# =============================================================================
# Stage 2: Runtime
# =============================================================================
# SECURITY: Pin base image to specific version for supply chain security
FROM python:3.11.9-slim

# Non-root user first so deps can live under /home/odinring (not /root — non-root cannot read /root/.local)
RUN useradd -m -u 1000 odinring

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOME=/home/odinring \
    PATH=/home/odinring/.local/bin:$PATH \
    PORT=8000

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies into app user's home (builder used /root/.local — same layout, readable by odinring)
COPY --from=builder --chown=odinring:odinring /root/.local /home/odinring/.local

# Copy application code
COPY --chown=odinring:odinring . .

# Switch to non-root user
USER odinring

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/status || exit 1

# Expose port
EXPOSE ${PORT}

# Start application with uvicorn (python -m avoids relying on shebang exec bits on some hosts)
CMD ["sh", "-c", "python -m uvicorn server:app --host 0.0.0.0 --port ${PORT} --workers 4"]

