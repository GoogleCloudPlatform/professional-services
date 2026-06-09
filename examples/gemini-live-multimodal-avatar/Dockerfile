# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build backend
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server/main.go

# Final stage
FROM alpine:latest
WORKDIR /app

# Copy binary from backend builder
COPY --from=backend-builder /app/server .

# Copy the internal directory so prompt.md is available
COPY --from=backend-builder /app/backend/internal ./internal

# Copy the data directory for the local JSON scenario fallback
COPY --from=backend-builder /app/backend/data ./data

# Copy built static files from frontend builder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set the environment variables
ENV STATIC_DIR=/app/frontend/dist
ENV PORT=8080

EXPOSE 8080

CMD ["./server"]