#!/bin/bash
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-8.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


# Exit immediately if a command exits with a non-zero status.
set -e

# --- Port Finding Function ---
# Checks if a given port is currently in use.
is_port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Finds the next available port starting from a given base port.
find_free_port() {
    local port=$1
    while is_port_in_use "$port"; do
        # Redirect this informational message to stderr
        echo "Port $port is in use, trying next..." >&2
        port=$((port + 1))
    done
    # Echo the final, clean port number to stdout
    echo "$port"
}

# Determine and export the port for the API server
API_PORT=$(find_free_port 8080)
export API_PORT

# Determine the port for the Streamlit UI
STREAMLIT_PORT=$(find_free_port 8501)

# --- Start Backend API Server ---
echo "Starting backend API server on port $API_PORT..."
uvicorn server:api --host 0.0.0.0 --port "$API_PORT" --reload &
API_PID=$!

# --- Cleanup Function ---
cleanup() {
    echo "\nShutting down backend API server (PID: $API_PID)..."
    if ps -p $API_PID > /dev/null; then
       # Send an interrupt signal, which is more graceful than SIGTERM
       kill -s SIGINT $API_PID
       echo "Server shut down."
    else
       echo "Server already stopped."
    fi
}

trap cleanup EXIT

# --- Wait for API Server to be Ready ---
echo "Waiting for API server to be ready..."
retries=15
count=0
# The /health endpoint is a reliable target for the health check
url="http://localhost:$API_PORT/health"

until $(curl --output /dev/null --silent --fail "$url"); do
    if [ ${count} -eq ${retries} ]; then
        echo "Error: API server failed to start after ${retries} attempts. Exiting."
        exit 1
    fi
    count=$(($count + 1))
    echo -n "."
    sleep 1
done

echo "\nAPI server is ready!"

# --- Start Frontend UI ---
# Start the frontend with the API_PORT environment variable set
echo "Starting Streamlit frontend on port $STREAMLIT_PORT..."
API_PORT=$API_PORT streamlit run app_ui.py --server.port "$STREAMLIT_PORT" --server.headless true
