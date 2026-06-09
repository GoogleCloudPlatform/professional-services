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

package domain

type AccountID string

type Money struct {
	Amount   int64  `json:"amount"`
	Currency string `json:"currency"`
}

type Transaction struct {
	ID        string `json:"id"`
	AccountID string `json:"account_id"`
	Amount    int64  `json:"amount"`
	Currency  string `json:"currency"`
	Date      string `json:"date"`
	Type      string `json:"type"` // e.g., "deposit", "withdrawal", "transfer"
}

type ToolRequest struct {
	ToolName  string                 `json:"tool_name"`
	Arguments map[string]interface{} `json:"arguments"`
}

type ToolResponse struct {
	Result interface{} `json:"result,omitempty"`
	Error  string      `json:"error,omitempty"`
}

type AppointmentSlot struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

type ConfigResponse struct {
	LiveAPIKey            string            `json:"live_api_key,omitempty"`
	ModelName             string            `json:"model_name"`
	SystemPrompt          string            `json:"system_prompt"`
	ClientName            string            `json:"client_name"`
	AvailableAppointments []AppointmentSlot `json:"available_appointments"`
	UseVertexAI           bool              `json:"use_vertex_ai"`
	UseGemini31Audio      bool              `json:"use_gemini_31_audio"`
	VertexProjectID       string            `json:"vertex_project_id,omitempty"`
	VertexLocation        string            `json:"vertex_location,omitempty"`
	AvatarMode            string            `json:"avatar_mode"` // "none", "heygen", "google_1p"
	Google1PAvatarName    string            `json:"google_1p_avatar_name,omitempty"`
	Google1PVoiceName     string            `json:"google_1p_voice_name,omitempty"`
	VadSilenceDurationMs  int               `json:"vad_silence_duration_ms"`
}

type HeygenTokenResponse struct {
	Token string `json:"token"`
}

type VertexConfig struct {
	ProjectID      string
	SearchLocation string
	EngineID       string
}
