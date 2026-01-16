# Stage 1: Builder - Use uv with Python 3.13 bookworm-slim
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS builder

# Install the project into /app
WORKDIR /app

# Enable bytecode compilation (faster startup)
ENV UV_COMPILE_BYTECODE=1

# Copy mode for mounted volumes
ENV UV_LINK_MODE=copy

# No dev dependencies
ENV UV_NO_DEV=1

# Install dependencies first (optimal caching)
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

# Copy full source and install project
COPY . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

# Stage 2: Runtime - Official slim Python image
FROM python:3.13-slim-bookworm

WORKDIR /app

# Create non-root user for security
RUN groupadd --system --gid 999 nonroot \
    && useradd --system --gid 999 --uid 999 --create-home nonroot

# Optional: Install netcat if you use it for health checks/wait-for-db
# (যদি না লাগে তাহলে এই RUN টা remove করতে পারো)
RUN apt-get update && apt-get install -y --no-install-recommends \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtualenv from builder
COPY --from=builder /app/.venv /app/.venv

# Add venv to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Copy entrypoint script (assume you have docker-entrypoint.sh)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy project files from builder (if needed for static/media etc.)
COPY --from=builder /app /app

# Python optimizations
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Fix permissions for non-root
RUN chown -R nonroot:nonroot /app /docker-entrypoint.sh

# Switch to non-root user
USER nonroot

# Expose the port
EXPOSE 8000

# Entrypoint for migrations/collectstatic etc.
ENTRYPOINT ["/docker-entrypoint.sh"]

# Default command: Gunicorn for production
CMD ["gunicorn", "isp_billing.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]