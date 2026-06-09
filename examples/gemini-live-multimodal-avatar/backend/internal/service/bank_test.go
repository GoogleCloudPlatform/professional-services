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
	"testing"

	"live-api-rewrite-backend/internal/service"
)

func TestBankService_GetAccountBalance(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	svc := service.NewBankService(scenarioSvc)
	ctx := context.Background()

	// Test valid account from scenario (ACCT-OP-1001 has 450,000 USD)
	balance, err := svc.GetAccountBalance(ctx, "ACCT-OP-1001", "")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if balance.Amount != 450000 || balance.Currency != "USD" {
		t.Errorf("unexpected balance: %+v", balance)
	}

	// Test invalid account
	_, err = svc.GetAccountBalance(ctx, "", "")
	if err == nil {
		t.Error("expected error for empty account, got nil")
	}

	// Test non-existent account
	_, err = svc.GetAccountBalance(ctx, "NON-EXISTENT", "")
	if err == nil {
		t.Error("expected error for non-existent account, got nil")
	}
}

func TestBankService_GetRecentTransactions(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	svc := service.NewBankService(scenarioSvc)
	ctx := context.Background()

	// Test valid account from scenario
	txs, err := svc.GetRecentTransactions(ctx, "ACCT-OP-1001", "", 2)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(txs) != 2 {
		t.Errorf("expected 2 transactions, got %d", len(txs))
	}

	// Test invalid limit
	_, err = svc.GetRecentTransactions(ctx, "ACCT-OP-1001", "", -1)
	if err == nil {
		t.Error("expected error for negative limit, got nil")
	}
}

func TestBankService_InitiateTransfer(t *testing.T) {
	scenarioSvc := createTestScenarioSvc()
	svc := service.NewBankService(scenarioSvc)
	ctx := context.Background()
	sessionID := "test_session_123"

	// Mock data so we can update it
	// By default the mock scenario store doesn't auto-create custom session instances.
	// So we need to ensure the scenarioSvc acts correctly, or just test the logic ignoring the mock limits.
	// We'll use a mocked scenario service approach if needed, or simply let it fail if the mock store isn't set up.
	// Let's just expect an error if the account isn't found in the mock custom store.

	// Our update logic blocks empty sessionID.
	err := svc.InitiateTransfer(ctx, "ACCT-OP-1001", "ACCT-ESC-2002", "", 500)
	if err == nil {
		t.Fatalf("expected error for empty sessionID during mutation, got nil")
	}

	// Test missing account
	err = svc.InitiateTransfer(ctx, "", "ACCT-ESC-2002", sessionID, 500)
	if err == nil {
		t.Error("expected error for missing from account, got nil")
	}

	// Note: We don't fully test successful transfer here because createTestScenarioSvc()
	// returns a mock firestore store that doesn't have custom scenarios pre-populated for sessionID.
	// A full integration test would create the custom scenario first.
}
