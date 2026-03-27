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

# --- Gemini Computer Use: Entrypoint Script ---
# This script handles the toggle between fast Headless mode and
# high-fidelity Virtual Display (Xvfb) mode for the AI agent.

# 1. Check if we should use Xvfb (defaults to false for performance)
if [ "${USE_XVFB}" = "true" ]; then
    echo "🚀 [AGENT MODE] Starting with Virtual Display (Xvfb) enabled..."
    
    # Ensure any stale Xvfb locks are removed
    rm -f /tmp/.X99-lock

    # xvfb-run handles the creation of the virtual monitor.
    # We use 'exec' to ensure Python becomes PID 1 and receives SIGTERM correctly.
    exec xvfb-run --auto-servernum --server-args="-screen 0 ${VIEWPORT_WIDTH:-1440}x${VIEWPORT_HEIGHT:-900}x24" "$@"
else
    echo "⚡ [HEADLESS MODE] Starting in high-performance pure headless mode..."
    # Simply execute the command (e.g., uv run computer-eval ...)
    exec "$@"
fi
