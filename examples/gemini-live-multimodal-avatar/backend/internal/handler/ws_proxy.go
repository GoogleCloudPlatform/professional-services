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
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  131072,
	WriteBufferSize: 131072,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for the demo
	},
}

// handleLiveAvatarProxy handles the WebSocket proxying between the frontend and Gemini/Vertex AI.
// This allows the backend to handle authentication (OAuth/ADC) securely without exposing
// credentials or GCP project details to the browser.
func (r *Router) handleLiveAvatarProxy(w http.ResponseWriter, req *http.Request) {
	// 1. Upgrade the incoming HTTP request to a WebSocket connection
	clientConn, err := upgrader.Upgrade(w, req, nil)
	if err != nil {
		slog.Error("Failed to upgrade client connection", slog.String("error", err.Error()))
		return
	}
	defer clientConn.Close()

	// 2. Determine if we are using Vertex AI or standard Google AI
	useVertex := r.useVertexAI
	if req.URL.Query().Get("vertex") == "true" || strings.Contains(req.URL.Path, "aiplatform") {
		useVertex = true
	}
	if req.URL.Query().Get("mode") == "google_1p" {
		useVertex = true
	}

	var upstreamURL string
	var authToken string

	if useVertex {
		region := r.vertexLocation
		if region == "" || region == "global" {
			region = "us-central1"
		}
		// Vertex AI LlmBidiService endpoint - note the /ws/ prefix
		upstreamURL = fmt.Sprintf("wss://%s-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent", region)

		// Fetch OAuth token from our internal AuthService (uses ADC)
		if r.authSvc != nil {
			token, err := r.authSvc.GetToken(req.Context())
			if err != nil {
				slog.Error("Proxy Auth Failure", slog.String("error", err.Error()))
				clientConn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseInternalServerErr, "Auth failure"))
				return
			}
			authToken = token.AccessToken
		}
	} else {
		// Standard Google AI (AI Studio) endpoint
		upstreamURL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService/BidiGenerateContent"
		if r.liveAPIKey != "" {
			upstreamURL += "?key=" + r.liveAPIKey
		}
	}

	// 3. Prepare the upstream URL with query-based authentication
	// Many WebSocket implementations are more reliable with query params than headers
	u, _ := url.Parse(upstreamURL)
	q := u.Query()
	if authToken != "" {
		q.Set("access_token", authToken)
	}
	u.RawQuery = q.Encode()
	slog.Info("Dialing Upstream Live API",
		slog.String("host", u.Host),
		slog.Bool("vertex", useVertex),
		slog.Bool("authenticated", authToken != ""))

	// Use the URL with query params, and no extra headers for maximum compatibility
	upstreamConn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		slog.Error("Upstream Connection Failed",
			slog.String("host", u.Host),
			slog.String("error", err.Error()))
		clientConn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseServiceRestart, "Upstream connection failed"))
		return
	}
	defer upstreamConn.Close()

	slog.Info("Upstream session established successfully")

	// 4. Start bi-directional pipe
	errChan := make(chan error, 2)
	isSetupDone := false

	// Upstream (Google) -> Client (Browser)
	go func() {
		for {
			messageType, payload, err := upstreamConn.ReadMessage()
			if err != nil {
				errChan <- fmt.Errorf("upstream read: %w", err)
				return
			}
			if err := clientConn.WriteMessage(messageType, payload); err != nil {
				errChan <- fmt.Errorf("client write: %w", err)
				return
			}
		}
	}()

	// Client (Browser) -> Upstream (Google)
	go func() {
		for {
			messageType, payload, err := clientConn.ReadMessage()
			if err != nil {
				errChan <- fmt.Errorf("client read: %w", err)
				return
			}

			// Intercept the first message (Setup) to qualify the model path server-side
			if useVertex && !isSetupDone && messageType == websocket.TextMessage {
				var msg map[string]interface{}
				if err := json.Unmarshal(payload, &msg); err == nil {
					if setup, ok := msg["setup"].(map[string]interface{}); ok {
						if model, ok := setup["model"].(string); ok {
							// If the frontend didn't fully qualify the model, do it now
							if !strings.HasPrefix(model, "projects/") {
								rawModel := model
								if strings.HasPrefix(rawModel, "publishers/google/models/") {
									rawModel = strings.TrimPrefix(rawModel, "publishers/google/models/")
								}
								if strings.HasPrefix(rawModel, "models/") {
									rawModel = strings.TrimPrefix(rawModel, "models/")
								}

								// Use the resolved region (e.g. us-central1) for the model path
								region := r.vertexLocation
								if region == "" || region == "global" {
									region = "us-central1"
								}

								qualifiedModel := fmt.Sprintf("projects/%s/locations/%s/publishers/google/models/%s", r.vertexProject, region, rawModel)
								setup["model"] = qualifiedModel

								slog.Info("Qualifying model path in proxy",
									slog.String("from", model),
									slog.String("to", qualifiedModel))

								if newPayload, err := json.Marshal(msg); err == nil {
									payload = newPayload
								}
							}
							isSetupDone = true
						}
					}
				}
			}

			if err := upstreamConn.WriteMessage(messageType, payload); err != nil {
				errChan <- fmt.Errorf("upstream write: %w", err)
				return
			}
		}
	}()

	// Wait for either side to close or an error to occur
	err = <-errChan
	if err != nil {
		var closeErr *websocket.CloseError
		if errors.As(err, &closeErr) {
			if closeErr.Code == websocket.CloseNormalClosure || closeErr.Code == websocket.CloseGoingAway {
				slog.Info("Proxy Session Closed Normally", slog.Int("code", closeErr.Code))
			} else {
				slog.Warn("Proxy Session Ended with WebSocket Close Error",
					slog.Int("code", closeErr.Code),
					slog.String("reason", closeErr.Text),
					slog.String("raw", err.Error()))
			}
		} else {
			slog.Warn("Proxy Session Ended with I/O Error", slog.String("error", err.Error()))
		}
	} else {
		slog.Info("Proxy Session Closed Normally")
	}
}
