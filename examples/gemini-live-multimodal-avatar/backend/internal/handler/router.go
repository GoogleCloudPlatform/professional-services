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
	"bytes"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"text/template"

	"firebase.google.com/go/v4/auth"
	"live-api-rewrite-backend/internal/domain"
	"live-api-rewrite-backend/internal/service"
)

type Router struct {
	mux                  *http.ServeMux
	liveAPIKey           string
	systemPrompt         *template.Template
	defaultCompanyName   string
	heygenAvatarID       string
	heygenVoiceID        string
	heygenSvc            service.HeygenService
	mcpServer            *MCPServer
	scenarioSvc          service.ScenarioService
	authSvc              service.AuthService
	firebaseAuth         *auth.Client
	useVertexAI          bool
	vertexProject        string
	vertexLocation       string
	googleAIModel        string
	vertexAIModel        string
	vertexAIAvatarModel  string
	telemetrySvc         service.TelemetryService
	avatarEnabled        bool
	google1PAvatarName   string
	vadSilenceDurationMs int
}

type RouterConfig struct {
	LiveAPIKey           string
	SystemPrompt         *template.Template
	DefaultCompanyName   string
	HeygenAvatarID       string
	HeygenVoiceID        string
	HeygenSvc            service.HeygenService
	StaticDir            string
	MCPServer            *MCPServer
	ScenarioSvc          service.ScenarioService
	AuthSvc              service.AuthService
	FirebaseAuth         *auth.Client
	UseVertexAI          bool
	VertexProject        string
	VertexLocation       string
	GoogleAIModel        string
	VertexAIModel        string
	VertexAIAvatarModel  string
	TelemetrySvc         service.TelemetryService
	AvatarEnabled        bool
	Google1PAvatarName   string
	VadSilenceDurationMs int
}

func NewRouter(cfg RouterConfig) http.Handler {
	r := &Router{
		mux:                 http.NewServeMux(),
		liveAPIKey:          cfg.LiveAPIKey,
		systemPrompt:        cfg.SystemPrompt,
		defaultCompanyName:  cfg.DefaultCompanyName,
		heygenAvatarID:      cfg.HeygenAvatarID,
		heygenVoiceID:       cfg.HeygenVoiceID,
		heygenSvc:           cfg.HeygenSvc,
		mcpServer:           cfg.MCPServer,
		scenarioSvc:         cfg.ScenarioSvc,
		authSvc:             cfg.AuthSvc,
		firebaseAuth:        cfg.FirebaseAuth,
		useVertexAI:         cfg.UseVertexAI,
		vertexProject:       cfg.VertexProject,
		vertexLocation:      cfg.VertexLocation,
		googleAIModel:       cfg.GoogleAIModel,
		vertexAIModel:       cfg.VertexAIModel,
		vertexAIAvatarModel: cfg.VertexAIAvatarModel,
		telemetrySvc:        cfg.TelemetrySvc,
		google1PAvatarName:  cfg.Google1PAvatarName, vadSilenceDurationMs: cfg.VadSilenceDurationMs,
	}
	r.mux.Handle("/api/config", AuthMiddleware(cfg.FirebaseAuth, http.HandlerFunc(r.handleConfig)))
	r.mux.Handle("/api/heygen-token", AuthMiddleware(cfg.FirebaseAuth, http.HandlerFunc(r.handleHeygenToken)))
	r.mux.Handle("/api/live-avatar/", AuthMiddleware(cfg.FirebaseAuth, http.HandlerFunc(r.handleLiveAvatarProxy)))
	r.mux.Handle("/api/tools/execute", AuthMiddleware(cfg.FirebaseAuth, http.HandlerFunc(r.mcpServer.HandleExecuteTool)))
	r.mux.Handle("/api/telemetry", AuthMiddleware(cfg.FirebaseAuth, http.HandlerFunc(r.handleTelemetry)))
	r.mux.Handle("/api/mcp", AuthMiddleware(cfg.FirebaseAuth, http.HandlerFunc(r.mcpServer.HandleMCP)))
	r.mux.Handle("/api/v1/scenarios", AuthMiddleware(cfg.FirebaseAuth, http.HandlerFunc(r.handleScenarios)))
	r.mux.Handle("/api/ws-proxy", AuthMiddleware(cfg.FirebaseAuth, http.HandlerFunc(r.handleWSProxy)))

	fs := http.FileServer(http.Dir(cfg.StaticDir))
	r.mux.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		// Single Page Application (SPA) Routing Fallback
		path := req.URL.Path
		fullPath := cfg.StaticDir + path

		// Check if the requested file exists on disk
		info, err := os.Stat(fullPath)
		if os.IsNotExist(err) || (err == nil && info.IsDir() && path != "/") {
			// If not (e.g., /advisor), serve index.html to let React Router handle it
			slog.Warn("SPA fallback triggered", slog.String("path", path))
			http.ServeFile(w, req, cfg.StaticDir+"/index.html")
			return
		}

		// Otherwise, serve the static file
		fs.ServeHTTP(w, req)
	})
	return GzipMiddleware(r.mux)
}

func GzipMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip gzip for WebSockets
		isUpgrade := strings.Contains(strings.ToLower(r.Header.Get("Connection")), "upgrade") &&
			strings.Contains(strings.ToLower(r.Header.Get("Upgrade")), "websocket")

		if isUpgrade {
			next.ServeHTTP(w, r)
			return
		}

		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}

		gw := &gzipResponseWriter{ResponseWriter: w}
		defer func() {
			if gw.gzipWriter != nil {
				gw.gzipWriter.Close()
			} else if !gw.wroteHeader {
				// Handle responses with no body (e.g. 202 Accepted)
				if gw.code == 0 {
					gw.code = http.StatusOK
				}
				gw.ResponseWriter.WriteHeader(gw.code)
			}
		}()

		next.ServeHTTP(gw, r)
	})
}

type gzipResponseWriter struct {
	http.ResponseWriter
	gzipWriter  *gzip.Writer
	code        int
	wroteHeader bool
}

func (w *gzipResponseWriter) WriteHeader(code int) {
	if w.wroteHeader {
		return
	}
	w.code = code
}

func (w *gzipResponseWriter) Write(b []byte) (int, error) {
	if !w.wroteHeader {
		if w.code == 0 {
			w.code = http.StatusOK
		}

		// Only compress successful responses and avoid double-compression
		if w.code < 400 && w.Header().Get("Content-Encoding") == "" {
			w.Header().Set("Content-Encoding", "gzip")
			w.Header().Del("Content-Length")
			w.ResponseWriter.WriteHeader(w.code)
			w.gzipWriter = gzip.NewWriter(w.ResponseWriter)
		} else {
			w.ResponseWriter.WriteHeader(w.code)
		}
		w.wroteHeader = true
	}

	if w.gzipWriter != nil {
		return w.gzipWriter.Write(b)
	}
	return w.ResponseWriter.Write(b)
}

type HeygenTokenRequest struct {
	Mode string `json:"mode"`
}

func (r *Router) handleHeygenToken(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if r.heygenSvc == nil {
		respondWithError(w, http.StatusServiceUnavailable, "HeyGen service is disabled")
		return
	}

	if r.heygenAvatarID == "" {
		respondWithError(w, http.StatusInternalServerError, "HeyGen Avatar ID is not configured")
		return
	}

	var reqBody HeygenTokenRequest
	_ = json.NewDecoder(req.Body).Decode(&reqBody)
	if reqBody.Mode == "" {
		reqBody.Mode = "FULL"
	}

	token, err := r.heygenSvc.GetSessionToken(req.Context(), r.heygenAvatarID, r.heygenVoiceID, reqBody.Mode)
	if err != nil {
		slog.Error("Failed to fetch HeyGen token", slog.String("error", err.Error()))
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch HeyGen token")
		return
	}

	resp := domain.HeygenTokenResponse{
		Token: token,
	}

	respondWithJSON(w, http.StatusOK, resp)
}

func (r *Router) handleConfig(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	personaID := req.URL.Query().Get("persona")
	if personaID == "" {
		personaID = "cre-advisor" // Default
	}

	languageParam := req.URL.Query().Get("lang")

	// Fetch dynamic scenario data based on selected persona
	scenario, err := r.scenarioSvc.GetScenario(req.Context(), personaID, "")
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to fetch scenario for %s: %v", personaID, err))
		return
	}

	if scenario.Persona.CompanyName == "" {
		scenario.Persona.CompanyName = r.defaultCompanyName
	}

	// Dynamic Language Override
	if languageParam != "" {
		langs := strings.Split(languageParam, ",")
		if len(langs) > 1 {
			// Multi-language (Bilingual/Multilingual) Mode
			// Start in the primary language, but allow switching to secondary languages.
			// Crucially, forbid echoing (responding in multiple languages simultaneously).
			primary := langs[0]
			secondary := strings.Join(langs[1:], " and ")
			scenario.Persona.LanguageOverrides = fmt.Sprintf("%s. However, you are also fluent in %s. If the user speaks to you in a supported language, or explicitly asks you to switch, you must switch entirely to that language. NEVER respond in multiple languages at the same time. Choose exactly ONE language per response", primary, secondary)
		} else {
			// Single Language Mode
			scenario.Persona.LanguageOverrides = langs[0]
		}
	}

	var parsedPrompt bytes.Buffer
	if err := r.systemPrompt.Execute(&parsedPrompt, scenario); err != nil {
		respondWithError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to execute system prompt template: %v", err))
		return
	}

	apiKeyToReturn := r.liveAPIKey
	modelNameToReturn := r.googleAIModel
	useVertexAIToReturn := r.useVertexAI
	avatarModeToReturn := "none" // Default to none if not specified

	// ALLOW FRONTEND OVERRIDE
	modeParam := req.URL.Query().Get("mode")
	if modeParam != "" {
		if modeParam == "none" || modeParam == "heygen" || modeParam == "google_1p" {
			avatarModeToReturn = modeParam
		}
	}

	// DEFENSIVE CONFIGURATION OVERRIDES
	// If 1P Avatar is requested, we MUST force Vertex AI and the specific 1P model.
	if avatarModeToReturn == "google_1p" {
		useVertexAIToReturn = true
		modelNameToReturn = r.vertexAIAvatarModel
	}
	// SECURITY & ARCHITECTURE NOTE:
	// When operating in Vertex AI mode, the frontend relies entirely on short-lived OAuth
	// tokens fetched from /api/auth/token rather than static API keys.
	if useVertexAIToReturn {
		apiKeyToReturn = "" // Do not leak the API key if we are using Vertex AI
		// When using the @google/genai SDK in a browser environment, it strictly forbids passing
		// 'project' and 'location' configurations. This means the SDK cannot auto-construct
		// the Vertex AI URL path.
		// We pass the raw model name here, and the frontend networkWorker.ts interceptor
		// will manually construct the fully qualified Vertex AI path and append the OAuth token.
		if avatarModeToReturn != "google_1p" {
			modelNameToReturn = r.vertexAIModel
		}
	}

	avatarNameToReturn := r.google1PAvatarName
	if avatarNameToReturn == "" {
		avatarNameToReturn = "Jay" // Default
	} else {
		avatarNameToReturn = strings.Title(strings.ToLower(avatarNameToReturn))
	}

	voiceNameToReturn := "aoede" // Default
	switch strings.ToLower(avatarNameToReturn) {
	case "paul":
		voiceNameToReturn = "charon"
	case "vera":
		voiceNameToReturn = "aoede"
	case "kai":
		voiceNameToReturn = "puck"
	case "piper":
		voiceNameToReturn = "aoede"
	case "jay":
		voiceNameToReturn = "rasalgethi"
	}

	voiceLanguageCodeToReturn := "en-GB"
	if languageParam != "" {
		langs := strings.Split(languageParam, ",")
		if len(langs) > 0 {
			switch langs[0] {
			case "French":
				voiceLanguageCodeToReturn = "fr-FR"
			case "Spanish":
				voiceLanguageCodeToReturn = "es-ES"
			}
		}
	}

	slog.Info("Session configuration generated",
		slog.String("persona", personaID),
		slog.String("lang", languageParam),
		slog.String("mode", avatarModeToReturn),
		slog.Bool("vertex", useVertexAIToReturn),
		slog.String("model", modelNameToReturn),
		slog.String("avatar", avatarNameToReturn),
		slog.String("voice", voiceNameToReturn),
		slog.String("voice_language_code", voiceLanguageCodeToReturn))

	resp := domain.ConfigResponse{
		LiveAPIKey:             apiKeyToReturn,
		ModelName:              modelNameToReturn,
		SystemPrompt:           parsedPrompt.String(),
		ClientName:             scenario.Persona.ClientProfile.Name,
		AvailableAppointments:  scenario.AvailableAppointments,
		UseVertexAI:            useVertexAIToReturn,
		VertexProjectID:        r.vertexProject,
		VertexLocation:         r.vertexLocation,
		AvatarMode:             avatarModeToReturn,
		Google1PAvatarName:     avatarNameToReturn,
		Google1PVoiceName:      voiceNameToReturn,
		VoiceLanguageCode:      voiceLanguageCodeToReturn,
		VadSilenceDurationMs:   r.vadSilenceDurationMs,
		SupportedVoices:        supportedVoices,
		SupportedAvatars:       supportedAvatars,
		SupportedLanguageCodes: supportedLanguageCodes,
	}

	respondWithJSON(w, http.StatusOK, resp)
}

type ScenarioSummary struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

func (r *Router) handleScenarios(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	scenarios, err := r.scenarioSvc.GetAvailableScenarios(req.Context(), "")
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to load scenarios")
		return
	}
	summaries := make([]ScenarioSummary, 0)
	for _, s := range scenarios {
		summaries = append(summaries, ScenarioSummary{
			ID:    s.ID,
			Label: s.Name,
		})
	}

	respondWithJSON(w, http.StatusOK, summaries)
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	slog.Error("HTTP ERROR", slog.Int("code", code), slog.String("message", message))
	respondWithJSON(w, code, domain.ToolResponse{Error: message})
}

var (
	supportedVoices = []domain.ConfigOption{
		{Value: "puck", Label: "Puck"},
		{Value: "zephyr", Label: "Zephyr"},
		{Value: "kore", Label: "Kore"},
		{Value: "orus", Label: "Orus"},
		{Value: "autonoe", Label: "Autonoe"},
		{Value: "umbriel", Label: "Umbriel"},
		{Value: "erinome", Label: "Erinome"},
		{Value: "laomedeia", Label: "Laomedeia"},
		{Value: "schedar", Label: "Schedar"},
		{Value: "achird", Label: "Achird"},
		{Value: "sadachbia", Label: "Sadachbia"},
		{Value: "fenrir", Label: "Fenrir"},
		{Value: "aoede", Label: "Aoede"},
		{Value: "enceladus", Label: "Enceladus"},
		{Value: "algieba", Label: "Algieba"},
		{Value: "algenib", Label: "Algenib"},
		{Value: "achernar", Label: "Achernar"},
		{Value: "gacrux", Label: "Gacrux"},
		{Value: "zubenelgenubi", Label: "Zubenelgenubi"},
		{Value: "sadaltager", Label: "Sadaltager"},
		{Value: "charon", Label: "Charon"},
		{Value: "leda", Label: "Leda"},
		{Value: "callirrhoe", Label: "Callirrhoe"},
		{Value: "iapetus", Label: "Iapetus"},
		{Value: "despina", Label: "Despina"},
		{Value: "rasalgethi", Label: "Rasalgethi"},
		{Value: "alnilam", Label: "Alnilam"},
		{Value: "pulcherrima", Label: "Pulcherrima"},
		{Value: "vindemiatrix", Label: "Vindemiatrix"},
		{Value: "sulafat", Label: "Sulafat"},
	}

	supportedAvatars = []domain.ConfigOption{
		{Value: "Ben", Label: "Ben (Male)"},
		{Value: "Carmen", Label: "Carmen (Female)"},
		{Value: "Ingrid", Label: "Ingrid (Female)"},
		{Value: "Jay", Label: "Jay (Male)"},
		{Value: "Kai", Label: "Kai (Male)"},
		{Value: "Kira", Label: "Kira (Female)"},
		{Value: "Leo", Label: "Leo (Male)"},
		{Value: "Paul", Label: "Paul (Male)"},
		{Value: "Piper", Label: "Piper (Female)"},
		{Value: "Sam", Label: "Sam (Male)"},
		{Value: "Vera", Label: "Vera (Female)"},
	}

	supportedLanguageCodes = []domain.ConfigOption{
		{Value: "en-GB", Label: "English (UK) - en-GB"},
		{Value: "en-US", Label: "English (US) - en-US"},
		{Value: "fr-FR", Label: "French (France) - fr-FR"},
		{Value: "fr-CA", Label: "French (Canada) - fr-CA"},
		{Value: "es-ES", Label: "Spanish (Spain) - es-ES"},
		{Value: "es-US", Label: "Spanish (US) - es-US"},
		{Value: "de-DE", Label: "German (Germany) - de-DE"},
		{Value: "ja-JP", Label: "Japanese (Japan) - ja-JP"},
	}
)
