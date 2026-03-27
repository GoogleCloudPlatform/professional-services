# --- Stage 1: Builder (Dependency Generation) ---
FROM python:3.12-slim-bookworm AS builder

# 1. Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# 2. Environment Setup
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=0

# 3. Synchronize Dependencies (using uv.lock for deterministic builds)
COPY pyproject.toml uv.lock uv.toml ./
RUN uv sync --frozen --no-install-project --no-dev

# --- Stage 2: Runtime (Final Production Image) ---
FROM python:3.12-slim-bookworm

# 1. Labels for Maintainability
LABEL maintainer="Computer Use Eval Team" \
      version="0.2.0" \
      description="Hardened Debian-based sandbox for AI-driven browser automation."

# 2. System Dependencies for Playwright & Xvfb
#    We install xvfb for the virtual monitor and essential libraries for rendering.
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    xvfb \
    xauth \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# 3. Security: Create non-root user (matching UID/GID defaults)
#    This prevents Chromium from disabling its own internal sandbox.
RUN groupadd -r computeruse && useradd -r -m -g computeruse -G audio,video computeruse \
    && mkdir -p /app/artifacts /app/logs \
    && chown -R computeruse:computeruse /app

# 4. Environment Variables
WORKDIR /app
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PLAYWRIGHT_HEADLESS=True \
    USE_XVFB=False \
    DISPLAY=:99 \
    HOME=/home/computeruse

# 5. Copy the virtual environment from the Builder
COPY --from=builder /app/.venv /app/.venv

# 6. Install Playwright System Drivers (Requires Root)
RUN /app/.venv/bin/playwright install-deps chromium

# 7. CACHE OPTIMIZATION: Install Browser Binaries BEFORE copying code
#    By placing this heavy download before the 'COPY . .' command, 
#    Docker caches the 160MB+ Chromium installation. Changing Python 
#    scripts will no longer trigger a massive re-download.
USER computeruse
RUN /app/.venv/bin/playwright install chromium
USER root

# 8. Copy Application Code
#    Since this layer changes frequently, it is placed as low as possible.
COPY --chown=computeruse:computeruse . .

# 9. Setup Entrypoint Script
RUN chmod +x /app/scripts/entrypoint.sh
ENTRYPOINT ["/app/scripts/entrypoint.sh"]

# 10. Switch to non-root user for execution
USER computeruse

# 11. Default Command (interactive runner)
CMD ["python", "computer_use_eval/runner.py", "--help"]
