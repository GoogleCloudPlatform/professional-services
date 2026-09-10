# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# ==============================================================================
# Production Multi-Stage Container for Cloud Run Deployment
# ==============================================================================
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml /app/
COPY webapp/requirements.txt /app/webapp/

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r webapp/requirements.txt

# Final runtime image
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080 \
    PATH="/install/bin:${PATH}" \
    PYTHONPATH="/app:/install/lib/python3.11/site-packages:${PYTHONPATH}"

# Copy installed dependencies from builder
COPY --from=builder /install /install

# Create non-root system user for security compliance
RUN groupadd -r appuser && useradd -r -g appuser -m -d /home/appuser appuser

# Copy application source code
COPY pyproject.toml /app/
COPY converter.py /app/
COPY agent_builder_to_adk/ /app/agent_builder_to_adk/
COPY webapp/ /app/webapp/

# Install the converter package in editable/local mode
RUN pip install --no-cache-dir -e .

# Set ownership to non-root user
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

# Dynamic $PORT binding for Cloud Run
CMD exec uvicorn webapp.app:app --host 0.0.0.0 --port ${PORT:-8080}
