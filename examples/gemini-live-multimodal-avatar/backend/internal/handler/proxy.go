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

	"github.com/gorilla/websocket"
)

func (r *Router) handleWSProxy(w http.ResponseWriter, req *http.Request) {
	slog.Info("Received WS proxy request")
	// Upgrade client connection
	clientConn, err := upgrader.Upgrade(w, req, nil)
	if err != nil {
		slog.Error("Failed to upgrade client connection", slog.String("error", err.Error()))
		return
	}
	defer clientConn.Close()
	slog.Info("Client connection upgraded to WebSocket")

	// Determine target URL
	location := r.vertexLocation
	if location == "global" || location == "" {
		location = "us-central1" // Fallback or default for live API
	}
	targetURL := fmt.Sprintf("wss://%s-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent", location)

	slog.Info("Initiating upstream connection", slog.String("url", targetURL))

	// Get access token
	var accessToken string
	if r.authSvc != nil {
		token, err := r.authSvc.GetToken(req.Context())
		if err != nil {
			slog.Error("Failed to get access token", slog.String("error", err.Error()))
			clientConn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseInternalServerErr, "Failed to get auth token"))
			return
		}
		accessToken = token.AccessToken
		slog.Info("Acquired access token")
	}

	// Connect to upstream
	header := http.Header{}
	header.Add("Authorization", "Bearer "+accessToken)
	header.Add("X-Goog-User-Project", r.vertexProject)
	header.Add("Content-Type", "application/json")

	upstreamConn, _, err := websocket.DefaultDialer.Dial(targetURL, header)
	if err != nil {
		slog.Error("Failed to connect to upstream", slog.String("error", err.Error()))
		clientConn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseInternalServerErr, "Failed to connect to upstream"))
		return
	}
	defer upstreamConn.Close()
	slog.Info("Connected to upstream Gemini Live API")

	// Channel to signal termination
	done := make(chan struct{})

	// Goroutine to read from upstream and write to client
	go func() {
		defer close(done)
		defer slog.Info("Upstream-to-client loop terminated")
		for {
			messageType, message, err := upstreamConn.ReadMessage()
			if err != nil {
				slog.Error("Error reading from upstream", slog.String("error", err.Error()))
				return
			}
			err = clientConn.WriteMessage(messageType, message)
			if err != nil {
				slog.Error("Error writing to client", slog.String("error", err.Error()))
				return
			}
		}
	}()

	// Goroutine to read from client and write to upstream
	isSetupDone := false
	defer slog.Info("Client-to-upstream loop terminated")
	for {
		select {
		case <-done:
			return
		default:
			messageType, message, err := clientConn.ReadMessage()
			if err != nil {
				slog.Error("Error reading from client", slog.String("error", err.Error()))
				return
			}

			if !isSetupDone {
				var dataJson map[string]interface{}
				if err := json.Unmarshal(message, &dataJson); err == nil {
					if setup, ok := dataJson["setup"].(map[string]interface{}); ok {
						if model, ok := setup["model"].(string); ok {
							// Rewrite model path
							oldModel := model
							setup["model"] = fmt.Sprintf("projects/%s/locations/%s/%s", r.vertexProject, r.vertexLocation, model)
							slog.Info("Rewrote setup model", slog.String("old", oldModel), slog.String("new", setup["model"].(string)))
							isSetupDone = true

							// Extract configuration properties safely for clean logging
							var avatarName, voiceName, languageCode string
							if avatarConfig, ok := setup["avatarConfig"].(map[string]interface{}); ok {
								avatarName, _ = avatarConfig["avatarName"].(string)
							} else if avatarConfig, ok := setup["avatar_config"].(map[string]interface{}); ok {
								avatarName, _ = avatarConfig["avatar_name"].(string)
							}

							if generationConfig, ok := setup["generationConfig"].(map[string]interface{}); ok {
								if speechConfig, ok := generationConfig["speechConfig"].(map[string]interface{}); ok {
									languageCode, _ = speechConfig["languageCode"].(string)
									if voiceConfig, ok := speechConfig["voiceConfig"].(map[string]interface{}); ok {
										if prebuiltVoiceConfig, ok := voiceConfig["prebuiltVoiceConfig"].(map[string]interface{}); ok {
											voiceName, _ = prebuiltVoiceConfig["voiceName"].(string)
										}
									}
								}
							} else if generationConfig, ok := setup["generation_config"].(map[string]interface{}); ok {
								if speechConfig, ok := generationConfig["speech_config"].(map[string]interface{}); ok {
									languageCode, _ = speechConfig["language_code"].(string)
									if voiceConfig, ok := speechConfig["voice_config"].(map[string]interface{}); ok {
										if prebuiltVoiceConfig, ok := voiceConfig["prebuilt_voice_config"].(map[string]interface{}); ok {
											voiceName, _ = prebuiltVoiceConfig["voice_name"].(string)
										}
									}
								}
							}

							slog.Info("Intercepted WebSocket Setup Message",
								slog.String("model", oldModel),
								slog.String("avatar", avatarName),
								slog.String("voice", voiceName),
								slog.String("language", languageCode),
							)

							// Re-encode message
							message, err = json.Marshal(dataJson)
							if err != nil {
								slog.Error("Failed to marshal setup message", slog.String("error", err.Error()))
								return
							}
						}
					}
				}
			}

			err = upstreamConn.WriteMessage(messageType, message)
			if err != nil {
				slog.Error("Error writing to upstream", slog.String("error", err.Error()))
				return
			}
		}
	}
}
