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
	"live-api-rewrite-backend/internal/service"
)

func createTestScenarioSvc() service.ScenarioService {
	store := &service.MockStore{
		Scenarios: map[string]map[string]interface{}{
			"cre-advisor": {
				"id":   "cre-advisor",
				"name": "CRE Advisor",
				"persona": map[string]interface{}{
					"client_profile": map[string]interface{}{
						"name": "Marcus Vance",
						"role": "CEO",
					},
				},
				"accounts": []interface{}{
					map[string]interface{}{
						"id":      "ACCT-OP-1001",
						"type":    "Operating Account",
						"balance": map[string]interface{}{"amount": int64(450000), "currency": "USD"},
					},
					map[string]interface{}{
						"id":      "ACCT-ESC-2002",
						"type":    "Escrow Account",
						"balance": map[string]interface{}{"amount": int64(125000), "currency": "USD"},
					},
				},
				"transactions": []interface{}{
					map[string]interface{}{"id": "tx1", "account_id": "ACCT-OP-1001", "amount": int64(-500)},
					map[string]interface{}{"id": "tx2", "account_id": "ACCT-OP-1001", "amount": int64(1000)},
				},
			},
		},
	}
	return service.NewTestScenarioService(store)
}
