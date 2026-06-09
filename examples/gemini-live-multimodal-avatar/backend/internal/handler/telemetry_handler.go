// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package handler

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
)

type TelemetryPayload struct {
	History []map[string]interface{} `json:"history"`
}

func (r *Router) handleTelemetry(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload TelemetryPayload
	if err := json.NewDecoder(req.Body).Decode(&payload); err != nil {
		respondWithError(w, http.StatusBadRequest, fmt.Sprintf("Failed to decode telemetry payload: %v", err))
		return
	}

	if r.telemetrySvc != nil {
		r.telemetrySvc.Push(payload.History)
	} else {
		slog.Warn("Telemetry service not initialized, logging only", slog.Int("count", len(payload.History)))
	}

	w.WriteHeader(http.StatusAccepted) // 202 Accepted (async processing)
}
