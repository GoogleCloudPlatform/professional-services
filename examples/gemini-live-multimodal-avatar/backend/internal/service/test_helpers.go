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
)

// MockStore is a shared mock implementation of the internal scenarioStore interface.
// It is exported so it can be used by tests in other packages (e.g., handler_test).
type MockStore struct {
	Scenarios       map[string]map[string]interface{}
	CustomScenarios map[string]map[string]interface{}

	// Error simulation
	GetScenarioErr     error
	GetAllScenariosErr error
	UpdateScenarioErr  error
}

func (m *MockStore) GetScenario(ctx context.Context, collection, id string) (map[string]interface{}, error) {
	if m.GetScenarioErr != nil {
		return nil, m.GetScenarioErr
	}

	col := m.Scenarios
	if collection == "custom_scenarios" {
		col = m.CustomScenarios
	}

	s, ok := col[id]
	if !ok {
		return nil, context.DeadlineExceeded
	}
	return s, nil
}

func (m *MockStore) GetAllScenarios(ctx context.Context, collection string) ([]map[string]interface{}, error) {
	if m.GetAllScenariosErr != nil {
		return nil, m.GetAllScenariosErr
	}

	col := m.Scenarios
	if collection == "custom_scenarios" {
		col = m.CustomScenarios
	}
	var list []map[string]interface{}
	for _, s := range col {
		list = append(list, s)
	}
	return list, nil
}

func (m *MockStore) GetScenariosBySession(ctx context.Context, collection, sessionID string) ([]map[string]interface{}, error) {
	if m.GetAllScenariosErr != nil {
		return nil, m.GetAllScenariosErr
	}

	col := m.CustomScenarios
	var list []map[string]interface{}
	for _, s := range col {
		if sid, ok := s["session_id"].(string); ok && sid == sessionID {
			list = append(list, s)
		}
	}
	return list, nil
}

func (m *MockStore) UpdateScenario(ctx context.Context, collection, id string, scenario map[string]interface{}) error {
	if m.UpdateScenarioErr != nil {
		return m.UpdateScenarioErr
	}

	if collection == "custom_scenarios" {
		if m.CustomScenarios == nil {
			m.CustomScenarios = make(map[string]map[string]interface{})
		}
		m.CustomScenarios[id] = scenario
	} else {
		if m.Scenarios == nil {
			m.Scenarios = make(map[string]map[string]interface{})
		}
		m.Scenarios[id] = scenario
	}
	return nil
}

func (m *MockStore) Close() error {
	return nil
}
