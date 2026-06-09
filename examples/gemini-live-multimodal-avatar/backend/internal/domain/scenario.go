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

// Persona represents the AI advisor's identity and instructions.
type Persona struct {
	ID                   string            `json:"id"`
	Role                 string            `json:"role"`
	TargetAudience       string            `json:"target_audience"`
	DomainKnowledge      string            `json:"domain_knowledge"`
	CoreSolutions        string            `json:"core_solutions"`
	CallToAction         string            `json:"call_to_action"`
	VoiceGuidelines      string            `json:"voice_guidelines"`
	Guardrails           string            `json:"guardrails"`
	LanguageOverrides    string            `json:"language_overrides,omitempty"`
	ConversationExamples []string          `json:"conversation_examples,omitempty"`
	ClientProfile        ClientProfile     `json:"client_profile"`
	Branches             []Branch          `json:"branches,omitempty"`
	Portfolios           map[string]Detail `json:"portfolios,omitempty"`
}

type Detail struct {
	Name        string `json:"name"`
	Allocation  string `json:"allocation"`
	Suitability string `json:"suitability"`
}

type Branch struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Address string `json:"address"`
	Region  string `json:"region"`
}

// Scenario represents the unified state of a user's mock data for a given session.
type Scenario struct {
	ID                     string            `json:"id"`
	Name                   string            `json:"name"`
	AllowedTools           []string          `json:"allowed_tools"`
	Google1PAvatarName     string            `json:"google_1p_avatar_name,omitempty"`
	Google1PVoiceName      string            `json:"google_1p_voice_name,omitempty"`
	Persona                Persona           `json:"persona"`
	CurrentDate            string            `json:"current_date"`
	AvailableAppointments  []AppointmentSlot `json:"available_appointments"`
	Accounts               []Account         `json:"accounts"`
	Transactions           []Transaction     `json:"transactions"`
	Properties             []Property        `json:"properties"`
	ActiveLoanApplications []LoanApplication `json:"active_loan_applications"`
}

type ClientProfile struct {
	Name            string `json:"name"`
	CompanyName     string `json:"company_name"`
	Role            string `json:"role"` // e.g., "Principal", "Managing Member"
	Address         string `json:"address,omitempty"`
	NearestBranchID string `json:"nearest_branch_id,omitempty"`
}

type Account struct {
	ID       AccountID `json:"id"`
	Type     string    `json:"type"` // e.g., "Operating Account", "Reserve Account", "Escrow"
	Balance  Money     `json:"balance"`
	Currency string    `json:"currency"`
}

type Property struct {
	ID             string `json:"id"`
	Address        string `json:"address"`
	PropertyType   string `json:"property_type"` // e.g., "Multifamily", "Retail", "Industrial"
	Units          int    `json:"units"`
	EstimatedValue Money  `json:"estimated_value"`
	ActiveLoanID   string `json:"active_loan_id"` // Reference to an active loan if any
}

type LoanApplication struct {
	ID                 string `json:"id"`
	PropertyID         string `json:"property_id"`
	RequestedAmount    Money  `json:"requested_amount"`
	Status             string `json:"status"` // e.g., "Underwriting", "Rate Locked", "Closing"
	EstimatedCloseDate string `json:"estimated_close_date"`
}
