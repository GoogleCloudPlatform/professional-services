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

package main

import (
	"context"
	"live-api-rewrite-backend/internal/domain"
	"live-api-rewrite-backend/internal/handler"
	"live-api-rewrite-backend/internal/service"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"strings"
	"text/template"

	firebase "firebase.google.com/go/v4"
	"golang.org/x/oauth2/google"
)

func main() {
	// Setup structured JSON logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	ctx := context.Background()

	// Fast-fail GCP authentication check
	_, err := google.FindDefaultCredentials(ctx, "https://www.googleapis.com/auth/cloud-platform")
	if err != nil {
		slog.Error("=================================================================================================")
		slog.Error("FATAL: Failed to authenticate with Google Cloud.")
		slog.Error("Your Application Default Credentials (ADC) are missing or expired.")
		slog.Error("Please run 'make auth' in the terminal to authenticate before starting the server.")
		slog.Error("Detailed error:", slog.String("error", err.Error()))
		slog.Error("=================================================================================================")
		os.Exit(1)
	}

	apiKey := os.Getenv("GEMINI_LIVE_API_KEY")
	if apiKey == "" {
		slog.Warn("GEMINI_LIVE_API_KEY is not set. The frontend will not be able to connect to the Gemini API securely.")
	}

	companyName := os.Getenv("COMPANY_NAME")
	if companyName == "" {
		companyName = "Cymbal Bank"
	}

	promptBytes, err := os.ReadFile("internal/domain/prompt.md")
	if err != nil {
		slog.Error("Failed to read system prompt template", slog.String("error", err.Error()))
		os.Exit(1)
	}

	systemPrompt, err := template.New("prompt").Parse(string(promptBytes))
	if err != nil {
		slog.Error("Failed to compile system prompt template", slog.String("error", err.Error()))
		os.Exit(1)
	}

	enableAvatarStr := os.Getenv("ENABLE_AVATAR")
	avatarEnabled := true
	if strings.ToLower(enableAvatarStr) == "false" {
		avatarEnabled = false
	}
	slog.Info("Avatar Configuration", slog.Bool("enabled", avatarEnabled), slog.String("raw_env", enableAvatarStr))

	heygenKey := os.Getenv("HEYGEN_API_KEY")
	heygenAvatarID := os.Getenv("HEYGEN_AVATAR_ID")
	heygenVoiceID := os.Getenv("HEYGEN_VOICE_ID")

	if avatarEnabled {
		logEnvVar := func(key string, val string, isSecret bool, isRequired bool) {
			if val == "" {
				if isRequired {
					slog.Warn(key + " is not set. The HeyGen avatar will not be able to initialize.")
				} else {
					slog.Info(key + " is not set. Using default.")
				}
			} else {
				if isSecret {
					slog.Info(key+" is set", slog.Int("len", len(val)))
				} else {
					slog.Info(key+" is set", slog.String("id", val))
				}
			}
		}

		logEnvVar("HEYGEN_API_KEY", heygenKey, true, true)
		logEnvVar("HEYGEN_AVATAR_ID", heygenAvatarID, false, true)
		logEnvVar("HEYGEN_VOICE_ID", heygenVoiceID, false, false)
	}

	vertexProjectID := os.Getenv("VERTEX_PROJECT_ID")
	if vertexProjectID == "" {
		slog.Error("VERTEX_PROJECT_ID is required")
		os.Exit(1)
	}

	vertexLocation := os.Getenv("VERTEX_LOCATION")
	if vertexLocation == "" {
		slog.Error("VERTEX_LOCATION is required")
		os.Exit(1)
	}

	vertexEngineID := os.Getenv("VERTEX_ENGINE_ID")
	if vertexEngineID == "" {
		slog.Error("VERTEX_ENGINE_ID is required")
		os.Exit(1)
	}

	vertexSearchLocation := os.Getenv("VERTEX_SEARCH_LOCATION")
	if vertexSearchLocation == "" {
		vertexSearchLocation = vertexLocation // Fallback
	}

	vertexConfig := domain.VertexConfig{
		ProjectID:      vertexProjectID,
		SearchLocation: vertexSearchLocation,
		EngineID:       vertexEngineID,
	}

	staticDir := os.Getenv("STATIC_DIR")
	if staticDir == "" {
		staticDir = "../frontend/dist"
	}

	useVertexAIStr := os.Getenv("USE_VERTEX_AI")
	useVertexAI := strings.ToLower(useVertexAIStr) == "true"

	searchSvc, err := service.NewVertexSearchService(ctx, vertexConfig)
	if err != nil {
		slog.Error("Failed to initialize Vertex AI Search service", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer searchSvc.Close()

	googleAIModel := os.Getenv("GOOGLE_AI_MODEL")
	if googleAIModel == "" {
		googleAIModel = "gemini-3.1-flash-live-preview"
	}

	vertexAIModel := os.Getenv("VERTEX_AI_MODEL")
	if vertexAIModel == "" {
		vertexAIModel = "publishers/google/models/gemini-live-2.5-flash-native-audio"
	}

	vertexAIAvatarModel := os.Getenv("VERTEX_AI_AVATAR_MODEL")
	if vertexAIAvatarModel == "" {
		vertexAIAvatarModel = "publishers/google/models/gemini-3.1-flash-live-preview-04-2026"
	}

	google1PAvatarName := os.Getenv("GOOGLE_1P_AVATAR_NAME")
	if google1PAvatarName == "" {
		google1PAvatarName = "Jay" // Default to whitelisted high-quality preset
	}

	vadSilenceDurationMsStr := os.Getenv("VAD_SILENCE_DURATION_MS")
	vadSilenceDurationMs := 400 // Default value
	if vadSilenceDurationMsStr != "" {
		if val, err := strconv.Atoi(vadSilenceDurationMsStr); err == nil {
			vadSilenceDurationMs = val
		} else {
			slog.Warn("Invalid VAD_SILENCE_DURATION_MS, falling back to default", slog.String("value", vadSilenceDurationMsStr), slog.Int("default", 400))
		}
	}

	scenarioSvc, err := service.NewScenarioService(vertexProjectID)
	if err != nil {
		slog.Error("Failed to initialize Scenario service", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer scenarioSvc.Close()

	bankService := service.NewBankService(scenarioSvc)
	heygenSvc := service.NewHeygenService(heygenKey)
	authSvc := service.NewAuthService()
	telemetrySvc := service.NewTelemetryService(ctx, ".", vertexProjectID)

	// Initialize Firebase App & Auth Client
	firebaseConf := &firebase.Config{ProjectID: vertexProjectID}
	firebaseApp, err := firebase.NewApp(ctx, firebaseConf)
	if err != nil {
		slog.Error("Failed to initialize Firebase App", slog.String("error", err.Error()))
		os.Exit(1)
	}
	firebaseAuth, err := firebaseApp.Auth(ctx)
	if err != nil {
		slog.Error("Failed to initialize Firebase Auth", slog.String("error", err.Error()))
		os.Exit(1)
	}

	mcpServer := handler.NewMCPServer(bankService, scenarioSvc, searchSvc)
	router := handler.NewRouter(handler.RouterConfig{LiveAPIKey: apiKey,
		SystemPrompt:         systemPrompt,
		DefaultCompanyName:   companyName,
		HeygenAvatarID:       heygenAvatarID,
		HeygenVoiceID:        heygenVoiceID,
		HeygenSvc:            heygenSvc,
		StaticDir:            staticDir,
		MCPServer:            mcpServer,
		ScenarioSvc:          scenarioSvc,
		AuthSvc:              authSvc,
		FirebaseAuth:         firebaseAuth,
		UseVertexAI:          useVertexAI,
		VertexProject:        vertexProjectID,
		VertexLocation:       vertexLocation,
		GoogleAIModel:        googleAIModel,
		VertexAIModel:        vertexAIModel,
		VertexAIAvatarModel:  vertexAIAvatarModel,
		TelemetrySvc:         telemetrySvc,
		Google1PAvatarName:   google1PAvatarName,
		VadSilenceDurationMs: vadSilenceDurationMs,
	})
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	errorLoggedRouter := handler.ErrorLoggingMiddleware(router)
	loggedRouter := handler.LoggingMiddleware(errorLoggedRouter)
	corsRouter := handler.CORSMiddleware(loggedRouter)

	slog.Info("Starting server", slog.String("port", port))
	if err := http.ListenAndServe(":"+port, corsRouter); err != nil {
		slog.Error("Server failed to start", slog.String("error", err.Error()))
		os.Exit(1)
	}
}
