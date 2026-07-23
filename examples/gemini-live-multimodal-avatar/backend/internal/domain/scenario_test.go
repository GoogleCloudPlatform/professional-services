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
	"encoding/json"
	"testing"

	"live-api-rewrite-backend/internal/domain"
)

func TestScenarioJSONUnmarshaling(t *testing.T) {
	jsonData := []byte(`{
		"id": "test-scenario-1",
		"allowed_tools": ["tool1", "tool2"],
		"persona": {
			"id": "persona-1",
			"role": "Advisor",
			"target_audience": "Everyone",
			"client_profile": {
				"name": "Jane Doe",
				"company_name": "Acme Corp",
				"role": "CEO"
			}
		},
		"accounts": [
			{
				"id": "acc-1",
				"type": "Checking",
				"balance": {"amount": 1000, "currency": "USD"},
				"currency": "USD"
			}
		]
	}`)

	var scenario domain.Scenario
	err := json.Unmarshal(jsonData, &scenario)
	if err != nil {
		t.Fatalf("Failed to unmarshal Scenario JSON: %v", err)
	}

	if scenario.ID != "test-scenario-1" {
		t.Errorf("Expected scenario.ID to be 'test-scenario-1', got '%s'", scenario.ID)
	}

	if len(scenario.AllowedTools) != 2 || scenario.AllowedTools[0] != "tool1" {
		t.Errorf("Expected scenario.AllowedTools to contain ['tool1', 'tool2'], got %v", scenario.AllowedTools)
	}

	if scenario.Persona.ID != "persona-1" {
		t.Errorf("Expected Persona.ID to be 'persona-1', got '%s'", scenario.Persona.ID)
	}

	if scenario.Persona.ClientProfile.Name != "Jane Doe" {
		t.Errorf("Expected ClientProfile.Name to be 'Jane Doe', got '%s'", scenario.Persona.ClientProfile.Name)
	}

	if len(scenario.Accounts) != 1 || scenario.Accounts[0].ID != "acc-1" {
		t.Errorf("Expected Accounts[0].ID to be 'acc-1', got '%s'", scenario.Accounts[0].ID)
	}
}
