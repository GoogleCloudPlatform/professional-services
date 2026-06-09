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

package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"
)

type HeygenService interface {
	GetSessionToken(ctx context.Context, avatarID string, voiceID string, mode string) (string, error)
}

type heygenServiceImpl struct {
	client  *http.Client
	apiKey  string
	baseURL string
}

func NewHeygenService(apiKey string) HeygenService {
	t := http.DefaultTransport.(*http.Transport).Clone()
	t.MaxIdleConns = 100
	t.MaxConnsPerHost = 100
	t.MaxIdleConnsPerHost = 100
	t.IdleConnTimeout = 90 * time.Second

	return &heygenServiceImpl{
		client:  &http.Client{Timeout: 60 * time.Second, Transport: t},
		apiKey:  apiKey,
		baseURL: "https://api.liveavatar.com/v1",
	}
}

func (s *heygenServiceImpl) GetSessionToken(ctx context.Context, avatarID string, voiceID string, mode string) (string, error) {
	if avatarID == "" {
		return "", fmt.Errorf("avatar ID cannot be empty")
	}

	if mode == "" {
		mode = "FULL"
	}

	avatarPersona := map[string]interface{}{}
	if voiceID != "" {
		avatarPersona["voice"] = map[string]interface{}{
			"voice_id": voiceID,
			"engine":   "ElevenLabs",
			"model_id": "eleven_turbo_v2_5",
		}
	}

	reqBodyObj := map[string]interface{}{
		"avatar_id":          avatarID,
		"mode":               mode,
		"interactivity_type": "CONVERSATIONAL",
		"quality":            "medium",
		"avatar_persona":     avatarPersona,
	}
	reqBody, _ := json.Marshal(reqBodyObj)

	url := fmt.Sprintf("%s/sessions/token", s.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Add("x-api-key", s.apiKey)
	req.Header.Add("Content-Type", "application/json")

	start := time.Now()
	slog.Info("HeyGen Token Request", slog.String("avatar_id", avatarID), slog.String("mode", mode))
	resp, err := s.client.Do(req)
	duration := time.Since(start)

	if err != nil {
		slog.Error("HeyGen API request failed", slog.Duration("duration", duration), slog.String("error", err.Error()))
		return "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		slog.Error("HeyGen API returned error status", slog.Duration("duration", duration), slog.Int("status", resp.StatusCode), slog.String("body", string(bodyBytes)))
		return "", fmt.Errorf("API returned non-200 status (%d): %s", resp.StatusCode, string(bodyBytes))
	}

	var heygenRes struct {
		Data struct {
			SessionToken string `json:"session_token"`
		} `json:"data"`
	}
	if err := json.Unmarshal(bodyBytes, &heygenRes); err != nil {
		slog.Error("Failed to decode HeyGen response", slog.Duration("duration", duration), slog.String("error", err.Error()), slog.String("body", string(bodyBytes)))
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	slog.Info("HeyGen Session Token Generated", slog.Duration("duration", duration), slog.String("avatar_id", avatarID), slog.Int("token_len", len(heygenRes.Data.SessionToken)))

	return heygenRes.Data.SessionToken, nil
}
