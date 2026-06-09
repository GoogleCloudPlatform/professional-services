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
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetSessionToken(t *testing.T) {
	// Create a mock HTTP server
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify method and headers
		if r.Method != "POST" {
			t.Errorf("Expected POST request, got %s", r.Method)
		}
		if r.Header.Get("x-api-key") != "test-api-key" {
			t.Errorf("Expected x-api-key header 'test-api-key', got '%s'", r.Header.Get("x-api-key"))
		}

		// Verify request body
		var reqBody map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
			t.Fatalf("Failed to decode request body: %v", err)
		}

		if reqBody["avatar_id"] != "test-avatar" {
			t.Errorf("Expected avatar_id 'test-avatar', got '%v'", reqBody["avatar_id"])
		}
		if reqBody["mode"] != "FULL" {
			t.Errorf("Expected mode 'FULL', got '%v'", reqBody["mode"])
		}
		if reqBody["interactivity_type"] != "CONVERSATIONAL" {
			t.Errorf("Expected interactivity_type 'CONVERSATIONAL', got '%v'", reqBody["interactivity_type"])
		}

		// Send mock response
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"data": {"session_token": "mock-token-123"}}`))
	}))
	defer mockServer.Close()

	// Initialize the service with the mock server URL
	svc := &heygenServiceImpl{
		client:  mockServer.Client(),
		apiKey:  "test-api-key",
		baseURL: mockServer.URL,
	}

	// Call the method
	token, err := svc.GetSessionToken(context.Background(), "test-avatar", "", "FULL")
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if token != "mock-token-123" {
		t.Errorf("Expected token 'mock-token-123', got '%s'", token)
	}
}

func TestGetSessionToken_EmptyAvatarID(t *testing.T) {
	svc := NewHeygenService("test-api-key")
	_, err := svc.GetSessionToken(context.Background(), "", "", "FULL")
	if err == nil {
		t.Fatal("Expected error for empty avatar ID, got none")
	}
}
