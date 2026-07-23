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

package service

import (
	"context"
	"live-api-rewrite-backend/internal/domain"
)

// MockSearcher is a mock implementation of domain.DocumentSearcher
type MockSearcher struct {
	SearchFunc func(ctx context.Context, query string) ([]domain.SearchResult, error)
	CloseFunc  func() error
}

func (m *MockSearcher) Search(ctx context.Context, query string) ([]domain.SearchResult, error) {
	if m.SearchFunc != nil {
		return m.SearchFunc(ctx, query)
	}
	return nil, nil
}

func (m *MockSearcher) Close() error {
	if m.CloseFunc != nil {
		return m.CloseFunc()
	}
	return nil
}

type MockScenarioService struct {
	GetScenarioFunc           func(ctx context.Context, id string, sessionID string) (domain.Scenario, error)
	GetAvailableScenariosFunc func(ctx context.Context, sessionID string) ([]domain.Scenario, error)
	UpdateScenarioFunc        func(ctx context.Context, id string, sessionID string, content map[string]interface{}) error
	GetAdvisorDynamicFormFunc func(ctx context.Context, id string, sessionID string) (map[string]interface{}, error)
	GetAccountFunc            func(ctx context.Context, id domain.AccountID, sessionID string) (domain.Account, error)
	GetTransactionsFunc       func(ctx context.Context, id domain.AccountID, sessionID string, limit int) ([]domain.Transaction, error)
}

func (m *MockScenarioService) GetScenario(ctx context.Context, id string, sessionID string) (domain.Scenario, error) {
	return m.GetScenarioFunc(ctx, id, sessionID)
}

func (m *MockScenarioService) GetAvailableScenarios(ctx context.Context, sessionID string) ([]domain.Scenario, error) {
	return m.GetAvailableScenariosFunc(ctx, sessionID)
}

func (m *MockScenarioService) UpdateScenario(ctx context.Context, id string, sessionID string, content map[string]interface{}) error {
	return m.UpdateScenarioFunc(ctx, id, sessionID, content)
}

func (m *MockScenarioService) GetAdvisorDynamicForm(ctx context.Context, id string, sessionID string) (map[string]interface{}, error) {
	return m.GetAdvisorDynamicFormFunc(ctx, id, sessionID)
}

func (m *MockScenarioService) GetAccount(ctx context.Context, id domain.AccountID, sessionID string) (domain.Account, error) {
	return m.GetAccountFunc(ctx, id, sessionID)
}

func (m *MockScenarioService) GetTransactions(ctx context.Context, id domain.AccountID, sessionID string, limit int) ([]domain.Transaction, error) {
	return m.GetTransactionsFunc(ctx, id, sessionID, limit)
}
