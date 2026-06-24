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

package service_test

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"live-api-rewrite-backend/internal/domain"
	"live-api-rewrite-backend/internal/service"
)

func TestGetScenario(t *testing.T) {
	svc := createTestScenarioSvc()
	scenario, err := svc.GetScenario(context.Background(), "cre-advisor", "")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	// Validate the persona matches
	if scenario.Persona.ClientProfile.Name != "Marcus Vance" {
		t.Errorf("expected Marcus Vance, got %s", scenario.Persona.ClientProfile.Name)
	}

	// Test with sessionId
	err = svc.UpdateScenario(context.Background(), "cre-advisor", "session123", map[string]interface{}{
		"/persona/client_profile/name": "Forked Name",
	})
	if err != nil {
		t.Fatalf("failed to update scenario: %v", err)
	}

	forked, err := svc.GetScenario(context.Background(), "cre-advisor", "session123")
	if err != nil {
		t.Fatalf("failed to get forked scenario: %v", err)
	}
	if forked.Persona.ClientProfile.Name != "Forked Name" {
		t.Errorf("expected Forked Name, got %s", forked.Persona.ClientProfile.Name)
	}
}

func TestGetScenario_DisasterPaths(t *testing.T) {
	t.Run("Firestore Timeout Triggers Fallback", func(t *testing.T) {
		store := &service.MockStore{
			GetAllScenariosErr: context.DeadlineExceeded,
		}
		svc := service.NewTestScenarioService(store)
		_, err := svc.GetScenario(context.Background(), "cre-advisor", "")
		if err != nil {
			t.Errorf("expected fallback to succeed despite timeout, got: %v", err)
		}
	})

	t.Run("Collection Not Found Triggers Fallback", func(t *testing.T) {
		store := &service.MockStore{
			Scenarios: make(map[string]map[string]interface{}), // Empty collection
		}
		svc := service.NewTestScenarioService(store)
		_, err := svc.GetScenario(context.Background(), "cre-advisor", "")
		if err != nil {
			t.Errorf("expected fallback to succeed for missing collection, got: %v", err)
		}
	})

	t.Run("Firestore Empty Fallback", func(t *testing.T) {
		store := &service.MockStore{
			Scenarios: make(map[string]map[string]interface{}), // Empty collection
		}
		svc := service.NewTestScenarioService(store)

		// Attempt to fetch available scenarios, which triggers the cache refresh and should fallback to local JSONs
		scenarios, err := svc.GetAvailableScenarios(context.Background(), "")
		if err != nil {
			t.Fatalf("expected no error due to local fallback, got %v", err)
		}
		if len(scenarios) == 0 {
			t.Error("expected scenarios from local fallback, got empty list")
		}

		// Ensure we can fetch a specific scenario from the local fallback cache
		scenario, err := svc.GetScenario(context.Background(), "cre-advisor", "")
		if err != nil {
			t.Fatalf("expected to get cre-advisor from local fallback, got error: %v", err)
		}
		if scenario.ID != "cre-advisor" {
			t.Errorf("expected scenario ID cre-advisor, got %s", scenario.ID)
		}
	})
}

func TestUpdateScenario_CacheInvalidation(t *testing.T) {
	store := &service.MockStore{
		Scenarios: map[string]map[string]interface{}{
			"base": {
				"id":   "base",
				"name": "Base Scenario",
			},
		},
	}
	svc := service.NewTestScenarioService(store)

	// First load into cache
	s1, _ := svc.GetScenario(context.Background(), "base", "")
	if s1.Name != "Base Scenario" {
		t.Errorf("expected Base Scenario, got %s", s1.Name)
	}

	// Update base scenario
	err := svc.UpdateScenario(context.Background(), "base", "", map[string]interface{}{
		"/name": "Updated Name",
	})
	if err != nil {
		t.Fatalf("update failed: %v", err)
	}

	// Fetch again - should be updated if cache was invalidated
	s2, _ := svc.GetScenario(context.Background(), "base", "")
	if s2.Name != "Updated Name" {
		t.Errorf("expected Updated Name, got %s. Cache invalidation failed.", s2.Name)
	}
}

func TestUpdateScenario_ValidationError(t *testing.T) {
	store := &service.MockStore{
		Scenarios: map[string]map[string]interface{}{
			"base": {
				"id":   "base",
				"name": "Base Scenario",
			},
		},
	}
	svc := service.NewTestScenarioService(store)

	// Attempt to update with invalid type (e.g., providing a string for an expected array/object)
	// 'allowed_tools' is expected to be []string
	err := svc.UpdateScenario(context.Background(), "base", "", map[string]interface{}{
		"/allowed_tools": "not-an-array",
	})

	if err == nil {
		t.Error("expected validation error, got nil")
	} else {
		if !strings.Contains(err.Error(), "allowed_tools") {
			t.Errorf("expected error message to pinpoint 'allowed_tools', got: %v", err)
		}
	}
}

func TestLocalScenarioFilesAreValid(t *testing.T) {
	dir := "../../data/scenarios"
	files, err := os.ReadDir(dir)
	if err != nil {
		t.Fatalf("failed to read scenarios directory: %v", err)
	}

	if len(files) == 0 {
		t.Fatal("no scenario files found in directory")
	}

	for _, file := range files {
		if filepath.Ext(file.Name()) == ".json" {
			t.Run(file.Name(), func(t *testing.T) {
				path := filepath.Join(dir, file.Name())
				data, err := os.ReadFile(path)
				if err != nil {
					t.Fatalf("failed to read file: %v", err)
				}

				var scenario domain.Scenario
				if err := json.Unmarshal(data, &scenario); err != nil {
					t.Errorf("failed to parse JSON into domain.Scenario: %v", err)
				}

				// Basic validation
				if scenario.ID == "" {
					t.Error("scenario ID is empty")
				}
				if scenario.Name == "" {
					t.Error("scenario Name is empty")
				}
				if scenario.Persona.Role == "" {
					t.Error("scenario Persona Role is empty")
				}
			})
		}
	}
}
