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

package domain_test

import (
	"bytes"
	"os"
	"strings"
	"testing"
	"text/template"

	"live-api-rewrite-backend/internal/domain"
)

func TestPromptTemplate_ValidKeys(t *testing.T) {
	// Locate the prompt.md file. When running tests, the working directory is usually the package directory.
	// We need to resolve the path relative to the root or relative to this package.
	// Assuming this test is run from inside internal/domain or project root.

	// Try to find the file by walking up a couple of directories if needed, or just use a relative path.
	// The safest way is to read the file from the current directory since the test runs in internal/domain.
	content, err := os.ReadFile("prompt.md")
	if err != nil {
		// Fallback for running tests from the project root (e.g. via make test)
		content, err = os.ReadFile("../../internal/domain/prompt.md")
		if err != nil {
			t.Fatalf("Failed to read prompt.md file: %v", err)
		}
	}

	// The main.go file replaces {{COMPANY_NAME}} before parsing. We MUST simulate that
	// to avoid parser syntax mismatches.
	promptStr := strings.ReplaceAll(string(content), "{{COMPANY_NAME}}", "Cymbal Bank")

	tmpl, err := template.New("prompt").Parse(promptStr)
	if err != nil {
		t.Fatalf("Failed to parse prompt.md as template: %v", err)
	}

	// Create a dummy scenario with all fields populated to ensure no nil pointers during execution
	dummyScenario := domain.Scenario{
		Persona: domain.Persona{
			ClientProfile: domain.ClientProfile{
				Name:        "Test User",
				CompanyName: "Test Company",
				Role:        "Admin",
			},
			Role:            "Test Role",
			TargetAudience:  "Test Audience",
			DomainKnowledge: "Test Knowledge",
			CoreSolutions:   "Test Solutions",
			CallToAction:    "Test CTA",
			VoiceGuidelines: "Test Guidelines",
			Guardrails:      "Test Guardrails",
		},
		Accounts: []domain.Account{
			{
				ID:       "123",
				Type:     "Checking",
				Balance:  domain.Money{Amount: 100, Currency: "USD"},
				Currency: "USD",
			},
		},
		Properties: []domain.Property{
			{
				ID:             "p1",
				Address:        "123 Main St",
				PropertyType:   "Retail",
				Units:          10,
				EstimatedValue: domain.Money{Amount: 1000000, Currency: "USD"},
			},
		},
		ActiveLoanApplications: []domain.LoanApplication{
			{
				ID:                 "l1",
				PropertyID:         "p1",
				RequestedAmount:    domain.Money{Amount: 500000, Currency: "USD"},
				Status:             "Pending",
				EstimatedCloseDate: "2026-04-01",
			},
		},
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, dummyScenario)
	if err != nil {
		t.Fatalf("Failed to execute template against domain.Scenario: %v\nThis means a variable in prompt.md does not match the struct fields.", err)
	}

	if buf.Len() == 0 {
		t.Fatal("Executed template output is empty")
	}
}
