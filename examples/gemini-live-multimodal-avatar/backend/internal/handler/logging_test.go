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

package handler_test

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"live-api-rewrite-backend/internal/handler"
)

func TestErrorLoggingMiddleware_PanicRecovery(t *testing.T) {
	// Setup a buffer to capture log output
	var buf bytes.Buffer
	handlerOpts := &slog.HandlerOptions{Level: slog.LevelDebug}
	jsonHandler := slog.NewJSONHandler(&buf, handlerOpts)
	logger := slog.New(jsonHandler)
	slog.SetDefault(logger)

	// Create a dummy handler that panics
	panicHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("test panic")
	})

	// Wrap it with the middleware
	mw := handler.ErrorLoggingMiddleware(panicHandler)

	req := httptest.NewRequest("GET", "/test-panic", nil)
	rr := httptest.NewRecorder()

	// Execute the request
	mw.ServeHTTP(rr, req)

	// Assert response status code is 500
	if rr.Code != http.StatusInternalServerError {
		t.Errorf("Expected status code 500, got %d", rr.Code)
	}

	// Read the logged output
	logOutput := buf.String()

	// Assuming the log output might have prefixes (like date/time), let's find the JSON part
	// For simplicity, let's just assert that the required fields are present in the JSON string
	if logOutput == "" {
		t.Fatal("Expected log output, got none")
	}

	// Verify required fields are present
	var logEntry map[string]interface{}
	err := json.Unmarshal(buf.Bytes(), &logEntry)
	if err != nil {
		t.Fatalf("Failed to parse log output as JSON: %v. Output: %s", err, logOutput)
	}

	// Verify required fields are present
	if logEntry["method"] != "GET" {
		t.Errorf("Expected method GET, got %v", logEntry["method"])
	}
	if logEntry["path"] != "/test-panic" {
		t.Errorf("Expected path /test-panic, got %v", logEntry["path"])
	}
	if logEntry["error"] != "test panic" {
		t.Errorf("Expected error 'test panic', got %v", logEntry["error"])
	}
	if logEntry["stack_trace"] == nil || logEntry["stack_trace"] == "" {
		t.Errorf("Expected stack_trace to be present, got %v", logEntry["stack_trace"])
	}
}
