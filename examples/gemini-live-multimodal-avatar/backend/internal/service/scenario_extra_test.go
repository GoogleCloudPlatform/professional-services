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
	"live-api-rewrite-backend/internal/domain"
	"live-api-rewrite-backend/internal/service"
	"testing"
)

func TestGetAvailableScenarios(t *testing.T) {
	store := &service.MockStore{
		Scenarios: map[string]map[string]interface{}{
			"base1": {"id": "base1", "name": "Base Scenario 1"},
		},
		CustomScenarios: map[string]map[string]interface{}{
			"session1_base1": {"id": "session1_base1", "session_id": "session1", "name": "Custom Scenario"},
		},
	}
	svc := service.NewTestScenarioService(store)

	scenarios, err := svc.GetAvailableScenarios(context.Background(), "session1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(scenarios) != 2 {
		t.Errorf("expected 2 scenarios (1 base, 1 custom), got %d", len(scenarios))
	}
}

func TestGetAdvisorDynamicForm(t *testing.T) {
	store := &service.MockStore{
		Scenarios: map[string]map[string]interface{}{
			"base1": {
				"id": "base1",
				"persona": map[string]interface{}{
					"name": "John Doe",
				},
				"tags": []interface{}{"tag1", "tag2"},
			},
		},
	}
	svc := service.NewTestScenarioService(store)

	form, err := svc.GetAdvisorDynamicForm(context.Background(), "base1", "")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if form["schema"] == nil || form["data"] == nil {
		t.Error("expected schema and data in dynamic form")
	}
}

func TestGetAccount(t *testing.T) {
	store := &service.MockStore{
		Scenarios: map[string]map[string]interface{}{
			"base": {
				"id": "base",
				"accounts": []interface{}{
					map[string]interface{}{
						"id":   "ACC1",
						"type": "Checking",
					},
				},
			},
		},
	}
	svc := service.NewTestScenarioService(store)

	// Test base cache hit
	acc, err := svc.GetAccount(context.Background(), domain.AccountID("ACC1"), "")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if acc.ID != "ACC1" {
		t.Errorf("expected ACC1, got %s", acc.ID)
	}

	// Test custom session hit
	store.CustomScenarios = map[string]map[string]interface{}{
		"session_base": {
			"id":         "session_base",
			"session_id": "session",
			"accounts": []interface{}{
				map[string]interface{}{
					"id":   "ACC2",
					"type": "Savings",
				},
			},
		},
	}
	acc2, err := svc.GetAccount(context.Background(), domain.AccountID("ACC2"), "session")
	if err != nil {
		t.Fatalf("expected no error for custom account, got %v", err)
	}
	if acc2.ID != "ACC2" {
		t.Errorf("expected ACC2, got %s", acc2.ID)
	}
}

func TestGetTransactions(t *testing.T) {
	store := &service.MockStore{
		Scenarios: map[string]map[string]interface{}{
			"base": {
				"id": "base",
				"transactions": []interface{}{
					map[string]interface{}{"id": "TX1", "account_id": "ACC1", "amount": 100},
					map[string]interface{}{"id": "TX2", "account_id": "ACC1", "amount": 200},
				},
			},
		},
	}
	svc := service.NewTestScenarioService(store)

	txs, err := svc.GetTransactions(context.Background(), domain.AccountID("ACC1"), "", 1)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(txs) != 1 {
		t.Errorf("expected 1 transaction due to limit, got %d", len(txs))
	}
}

func TestGetTransactionsCustom(t *testing.T) {
	store := &service.MockStore{
		CustomScenarios: map[string]map[string]interface{}{
			"session1_base": {
				"id":         "session1_base",
				"session_id": "session1",
				"transactions": []interface{}{
					map[string]interface{}{"id": "TX1", "account_id": "ACC1", "amount": 100},
					map[string]interface{}{"id": "TX2", "account_id": "ACC1", "amount": 200},
				},
			},
		},
	}
	svc := service.NewTestScenarioService(store)

	txs, err := svc.GetTransactions(context.Background(), domain.AccountID("ACC1"), "session1", 1)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(txs) != 1 {
		t.Errorf("expected 1 transaction due to limit, got %d", len(txs))
	}
}
