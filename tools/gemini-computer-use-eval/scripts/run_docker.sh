#!/bin/bash

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

set -e

# --- Gemini Computer Use: Docker Run Wrapper ---
# This script simplifies running the agent in the Docker sandbox.
# It automatically handles host permissions, timezones, and volume setups.

# 1. Ensure target directories exist and have open permissions 
#    (Crucial for rootless Podman/Docker to write artifacts back to the host)
mkdir -p artifacts logs
chmod a+rwx artifacts logs 2>/dev/null || true

# 2. Capture Host Environment for Docker Compose mapping
USER_ID=$(id -u)
export USER_ID
GROUP_ID=$(id -g)
export GROUP_ID
export TZ=${TZ:-UTC}
export PYTHONPATH=/app

# 3. Set standard fallback defaults (can be overridden by .env or command line)
export USE_XVFB=${USE_XVFB:-false}
export PLAYWRIGHT_HEADLESS=${PLAYWRIGHT_HEADLESS:-true}

echo "=========================================================="
echo " 🚀 Starting Computer Use Eval in Docker Sandbox"
echo "=========================================================="
echo " 👤 Mapped Host UID/GID : ${USER_ID}:${GROUP_ID}"
echo " 🌍 Timezone            : ${TZ}"
echo " 📺 Virtual Display     : ${USE_XVFB} (Headless: ${PLAYWRIGHT_HEADLESS})"
echo "=========================================================="

# 4. Execute the container and pass all arguments to the python runner
docker compose run --rm eval-agent python -m computer_use_eval.runner "$@"
