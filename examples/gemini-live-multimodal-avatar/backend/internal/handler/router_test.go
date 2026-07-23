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
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"text/template"

	"live-api-rewrite-backend/internal/domain"
	"live-api-rewrite-backend/internal/handler"
	"live-api-rewrite-backend/internal/service"
)

func createTestScenarioSvc() service.ScenarioService {
	store := &service.MockStore{
		Scenarios: map[string]map[string]interface{}{
			"cre-advisor": {
				"id":   "cre-advisor",
				"name": "CRE Advisor",
				"allowed_tools": []interface{}{
					"render_a2ui_surface",
					"get_account_balance",
					"get_recent_transactions",
					"schedule_appointment",
					"send_email",
					"vertex_ai_search",
					"get_market_insights_api",
				},
				"persona": map[string]interface{}{
					"client_profile": map[string]interface{}{
						"name": "Marcus Vance",
						"role": "CEO",
					},
				},
				"accounts": []interface{}{
					map[string]interface{}{
						"id":      "ACCT-OP-1001",
						"type":    "Operating Account",
						"balance": map[string]interface{}{"amount": int64(450000), "currency": "USD"},
					},
				},
			},
		},
	}
	return service.NewTestScenarioService(store)
}

func createDefaultTestRouter(scenarioSvc service.ScenarioService) http.Handler {
	svc := service.NewBankService(scenarioSvc)
	searchSvc := &service.MockSearcher{}
	mcpServer := handler.NewMCPServer(svc, scenarioSvc, searchSvc)
	heygenSvc := service.NewHeygenService("test-heygen-key")
	tmpl, _ := template.New("prompt").Parse("test-prompt {{.Persona.ClientProfile.Name}}")

	cfg := handler.RouterConfig{
		LiveAPIKey:     "test-api-key",
		SystemPrompt:   tmpl,
		HeygenAvatarID: "test-avatar-id",
		HeygenSvc:      heygenSvc,
		MCPServer:      mcpServer,
		ScenarioSvc:    scenarioSvc,
	}
	return handler.NewRouter(cfg)
}

func TestConfigHandler(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	r := createDefaultTestRouter(scenarioSvc)

	req, _ := http.NewRequest("GET", "/api/config?persona=cre-advisor", nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var configResp domain.ConfigResponse
	err := json.NewDecoder(rr.Body).Decode(&configResp)
	if err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if configResp.LiveAPIKey != "test-api-key" {
		t.Errorf("handler returned unexpected body: got %v want %v", configResp.LiveAPIKey, "test-api-key")
	}

	if configResp.ClientName != "Marcus Vance" {
		t.Errorf("expected client name 'Marcus Vance', got %s", configResp.ClientName)
	}

	if len(configResp.AvailableAppointments) == 0 {
		t.Errorf("expected available appointments, got none")
	}
}

func TestConfigHandler_VertexModelParsing(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	tmpl, _ := template.New("prompt").Parse("test-prompt")

	tests := []struct {
		name          string
		vertexAIModel string
		expectedModel string
	}{
		{
			name:          "Short Name",
			vertexAIModel: "gemini-live-2.5-flash",
			expectedModel: "gemini-live-2.5-flash",
		},
		{
			name:          "Publishers Prefix",
			vertexAIModel: "publishers/google/models/gemini-live-2.5-flash",
			expectedModel: "publishers/google/models/gemini-live-2.5-flash",
		},
		{
			name:          "Fully Qualified Path",
			vertexAIModel: "projects/my-project/locations/us-west1/publishers/google/models/gemini-live",
			expectedModel: "projects/my-project/locations/us-west1/publishers/google/models/gemini-live",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			r := handler.NewRouter(handler.RouterConfig{
				SystemPrompt:   tmpl,
				ScenarioSvc:    scenarioSvc,
				UseVertexAI:    true,
				VertexProject:  "test-project",
				VertexLocation: "us-central1",
				VertexAIModel:  tc.vertexAIModel,
			})

			req, _ := http.NewRequest("GET", "/api/config?persona=cre-advisor", nil)
			rr := httptest.NewRecorder()

			r.ServeHTTP(rr, req)

			if status := rr.Code; status != http.StatusOK {
				t.Fatalf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
			}

			var configResp domain.ConfigResponse
			if err := json.NewDecoder(rr.Body).Decode(&configResp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if configResp.ModelName != tc.expectedModel {
				t.Errorf("Expected model name:\n%s\nGot:\n%s", tc.expectedModel, configResp.ModelName)
			}

			if configResp.LiveAPIKey != "" {
				t.Errorf("Expected LiveAPIKey to be stripped in Vertex mode, got: %s", configResp.LiveAPIKey)
			}
		})
	}
}

func TestExecuteToolHandler_GetAccountBalance(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	r := createDefaultTestRouter(scenarioSvc)

	payload := domain.ToolRequest{
		ToolName: "get_account_balance",
		Arguments: map[string]interface{}{
			"account_id": "ACCT-OP-1001",
		},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "/api/tools/execute", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp domain.ToolResponse
	err := json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "" {
		t.Errorf("expected no error in response, got %s", resp.Error)
	}
}

func TestExecuteToolHandler_ScheduleAppointment(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	r := createDefaultTestRouter(scenarioSvc)

	payload := domain.ToolRequest{
		ToolName: "schedule_appointment",
		Arguments: map[string]interface{}{
			"time":     "Tuesday at 10:00 AM",
			"location": "Sunnyvale Branch",
			"topic":    "CRE Loan",
		},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "/api/tools/execute", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp domain.ToolResponse
	err := json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	result, ok := resp.Result.(map[string]interface{})
	if !ok {
		t.Fatalf("expected result to be map, got %T", resp.Result)
	}

	if result["status"] != "success" {
		t.Errorf("expected status 'success', got %v", result["status"])
	}

	if result["date"] != "Tuesday at 10:00 AM" {
		t.Errorf("expected time 'Tuesday at 10:00 AM', got %v", result["date"])
	}
}

func TestExecuteToolHandler_SendEmail(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	r := createDefaultTestRouter(scenarioSvc)

	payload := domain.ToolRequest{
		ToolName: "send_email",
		Arguments: map[string]interface{}{
			"recipient": "test@example.com",
			"subject":   "Test Email",
			"body":      "This is a test email.",
		},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "/api/tools/execute", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp domain.ToolResponse
	err := json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	result, ok := resp.Result.(map[string]interface{})
	if !ok {
		t.Fatalf("expected result to be map, got %T", resp.Result)
	}

	if result["title"] != "Email Sent" {
		t.Errorf("expected title 'Email Sent', got %v", result["title"])
	}
}

func TestExecuteToolHandler_VertexSearch(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	svc := service.NewBankService(scenarioSvc)
	mockResults := []domain.SearchResult{{Title: "Test"}}
	searchSvc := &service.MockSearcher{
		SearchFunc: func(ctx context.Context, query string) ([]domain.SearchResult, error) {
			return mockResults, nil
		},
	}
	mcpServer := handler.NewMCPServer(svc, scenarioSvc, searchSvc)
	heygenSvc := service.NewHeygenService("test-heygen-key")
	tmpl, _ := template.New("prompt").Parse("test-prompt")
	r := handler.NewRouter(handler.RouterConfig{
		LiveAPIKey:     "test-api-key",
		SystemPrompt:   tmpl,
		HeygenAvatarID: "test-avatar-id",
		HeygenVoiceID:  "",
		HeygenSvc:      heygenSvc,
		StaticDir:      "test-static-dir",
		MCPServer:      mcpServer,
		ScenarioSvc:    scenarioSvc,
		AuthSvc:        nil,
		UseVertexAI:    false,
		VertexProject:  "test-project",
		VertexLocation: "global",
		GoogleAIModel:  "google-model",
		VertexAIModel:  "vertex-model",
	})

	payload := domain.ToolRequest{
		ToolName: "vertex_ai_search",
		Arguments: map[string]interface{}{
			"query": "test query",
		},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "/api/tools/execute", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp domain.ToolResponse
	err := json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "" {
		t.Errorf("expected no error in response, got %s", resp.Error)
	}
}

func TestExecuteToolHandler_GetMarketInsightsAPI(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	svc := service.NewBankService(scenarioSvc)
	searchSvc := &service.MockSearcher{}
	mcpServer := handler.NewMCPServer(svc, scenarioSvc, searchSvc)
	heygenSvc := service.NewHeygenService("test-heygen-key")
	authSvc := service.NewAuthService()
	telemetrySvc := service.NewTelemetryService(context.Background(), ".", "test-project")

	router := handler.NewRouter(handler.RouterConfig{
		LiveAPIKey:     "test-api-key",
		SystemPrompt:   template.Must(template.New("test").Parse("test prompt")),
		HeygenAvatarID: "test-avatar",
		HeygenVoiceID:  "test-voice",
		HeygenSvc:      heygenSvc,
		MCPServer:      mcpServer,
		ScenarioSvc:    scenarioSvc,
		AuthSvc:        authSvc,
		TelemetrySvc:   telemetrySvc,
	})

	body := `{"tool_name": "get_market_insights_api", "arguments": {"query": "Oil Prices"}}`
	req := httptest.NewRequest("POST", "/api/tools/execute", strings.NewReader(body))
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var resp domain.ToolResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	resultMap, ok := resp.Result.(map[string]interface{})
	if !ok || resultMap["query"] != "Oil Prices" {
		t.Errorf("unexpected result: %v", resp.Result)
	}
}

func TestExecuteToolHandler_InvalidTool(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	r := createDefaultTestRouter(scenarioSvc)

	payload := domain.ToolRequest{
		ToolName:  "invalid_tool_name",
		Arguments: map[string]interface{}{},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "/api/tools/execute", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

func TestScenariosHandler(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	r := createDefaultTestRouter(scenarioSvc)

	req, _ := http.NewRequest("GET", "/api/v1/scenarios", nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var scenarios []struct {
		ID    string `json:"id"`
		Label string `json:"label"`
	}
	err := json.NewDecoder(rr.Body).Decode(&scenarios)
	if err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(scenarios) == 0 {
		t.Errorf("expected scenarios to be returned")
	}
	if scenarios[0].ID != "cre-advisor" {
		t.Errorf("expected cre-advisor, got %s", scenarios[0].ID)
	}
}

func TestSPARoutingFallback(t *testing.T) {
	// Create a temporary directory for static files
	tmpDir := t.TempDir()

	// Create mock index.html
	indexContent := "<html>mock index</html>"
	if err := os.WriteFile(filepath.Join(tmpDir, "index.html"), []byte(indexContent), 0644); err != nil {
		t.Fatalf("failed to create mock index.html: %v", err)
	}

	// Create mock CSS file
	cssContent := "body { color: red; }"
	if err := os.WriteFile(filepath.Join(tmpDir, "style.css"), []byte(cssContent), 0644); err != nil {
		t.Fatalf("failed to create mock style.css: %v", err)
	}

	scenarioSvc := createTestScenarioSvc()
	bankSvc := service.NewBankService(scenarioSvc)
	searchSvc := &service.MockSearcher{}

	cfg := handler.RouterConfig{
		StaticDir:   tmpDir,
		ScenarioSvc: scenarioSvc,
		MCPServer:   handler.NewMCPServer(bankSvc, scenarioSvc, searchSvc),
	}
	router := handler.NewRouter(cfg)

	tests := []struct {
		name           string
		path           string
		expectedStatus int
		expectedBody   string
	}{
		{
			name:           "Root path serves index.html",
			path:           "/",
			expectedStatus: http.StatusOK,
			expectedBody:   "<html>mock index</html>",
		},
		{
			name:           "Existing static file serves file content",
			path:           "/style.css",
			expectedStatus: http.StatusOK,
			expectedBody:   "body { color: red; }",
		},
		{
			name:           "Unknown frontend route falls back to index.html (SPA)",
			path:           "/advisor",
			expectedStatus: http.StatusOK,
			expectedBody:   "<html>mock index</html>",
		},
		{
			name:           "Unknown nested frontend route falls back to index.html (SPA)",
			path:           "/dashboard/settings",
			expectedStatus: http.StatusOK,
			expectedBody:   "<html>mock index</html>",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", tt.path, nil)
			req.Header.Set("Accept-Encoding", "identity") // Disable gzip for easier body assertion in tests

			rr := httptest.NewRecorder()
			router.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.expectedStatus {
				t.Errorf("handler returned wrong status code: got %v want %v", status, tt.expectedStatus)
			}

			if !strings.Contains(rr.Body.String(), strings.TrimSpace(tt.expectedBody)) {
				t.Errorf("handler returned unexpected body: got %v want it to contain %v", rr.Body.String(), tt.expectedBody)
			}
		})
	}
}

func TestConfigHandler_LanguageOverride(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	tmpl, _ := template.New("prompt").Parse("Speak in {{if .Persona.LanguageOverrides}}{{.Persona.LanguageOverrides}}{{else}}English{{end}}")

	r := handler.NewRouter(handler.RouterConfig{
		SystemPrompt: tmpl,
		ScenarioSvc:  scenarioSvc,
	})

	tests := []struct {
		name             string
		url              string
		expectedLanguage string
	}{
		{
			name:             "Default Language",
			url:              "/api/config?persona=cre-advisor",
			expectedLanguage: "Speak in English",
		},
		{
			name:             "Spanish Override",
			url:              "/api/config?persona=cre-advisor&lang=Spanish",
			expectedLanguage: "Speak in Spanish",
		},
		{
			name:             "English Override",
			url:              "/api/config?persona=cre-advisor&lang=English",
			expectedLanguage: "Speak in English",
		},
		{
			name:             "Bilingual Override",
			url:              "/api/config?persona=cre-advisor&lang=English,Spanish",
			expectedLanguage: "Speak in English. However, you are also fluent in Spanish. If the user speaks to you in a supported language, or explicitly asks you to switch, you must switch entirely to that language. NEVER respond in multiple languages at the same time. Choose exactly ONE language per response",
		},
		{
			name:             "Trilingual Override",
			url:              "/api/config?persona=cre-advisor&lang=English,Spanish,French",
			expectedLanguage: "Speak in English. However, you are also fluent in Spanish and French. If the user speaks to you in a supported language, or explicitly asks you to switch, you must switch entirely to that language. NEVER respond in multiple languages at the same time. Choose exactly ONE language per response",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", tt.url, nil)
			rr := httptest.NewRecorder()

			r.ServeHTTP(rr, req)

			if status := rr.Code; status != http.StatusOK {
				t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
			}

			var configResp domain.ConfigResponse
			json.NewDecoder(rr.Body).Decode(&configResp)

			if configResp.SystemPrompt != tt.expectedLanguage {
				t.Errorf("handler returned unexpected prompt: got %q want %q", configResp.SystemPrompt, tt.expectedLanguage)
			}
		})
	}
}

func TestConfigHandler_AvatarMode(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	tmpl, _ := template.New("prompt").Parse("test-prompt")

	tests := []struct {
		name               string
		queryMode          string
		expectedMode       string
		expectedAvatarName string
	}{
		{
			name:               "None Mode (Fallback default when not specified)",
			queryMode:          "",
			expectedMode:       "none",
			expectedAvatarName: "Piper",
		},
		{
			name:               "HeyGen Mode",
			queryMode:          "heygen",
			expectedMode:       "heygen",
			expectedAvatarName: "Piper",
		},
		{
			name:               "Google 1P Mode - Forces Vertex and Model",
			queryMode:          "google_1p",
			expectedMode:       "google_1p",
			expectedAvatarName: "Piper",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			r := handler.NewRouter(handler.RouterConfig{
				SystemPrompt:        tmpl,
				ScenarioSvc:         scenarioSvc,
				GoogleAIModel:       "google-model",
				VertexAIModel:       "vertex-model",
				VertexAIAvatarModel: "publishers/google/models/gemini-3.1-flash-live-preview-04-2026",
				Google1PAvatarName:  "Piper",
			})

			url := "/api/config?persona=cre-advisor"
			if tc.queryMode != "" {
				url += "&mode=" + tc.queryMode
			}
			req, _ := http.NewRequest("GET", url, nil)
			rr := httptest.NewRecorder()

			r.ServeHTTP(rr, req)

			var configResp domain.ConfigResponse
			if err := json.NewDecoder(rr.Body).Decode(&configResp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if configResp.AvatarMode != tc.expectedMode {
				t.Errorf("Expected mode %s, got %s", tc.expectedMode, configResp.AvatarMode)
			}

			if configResp.Google1PAvatarName != tc.expectedAvatarName {
				t.Errorf("Expected avatar name %s, got %s", tc.expectedAvatarName, configResp.Google1PAvatarName)
			}

			if tc.expectedMode == "google_1p" {
				if !configResp.UseVertexAI {
					t.Error("Expected UseVertexAI to be true for google_1p")
				}
				expectedModel := "publishers/google/models/gemini-3.1-flash-live-preview-04-2026"
				if configResp.ModelName != expectedModel {
					t.Errorf("Expected model %s, got %s", expectedModel, configResp.ModelName)
				}
			}
		})
	}
}
