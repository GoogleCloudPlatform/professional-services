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

func TestTransferIntegration_FullLifecycle(t *testing.T) {
	// 1. Setup Scenario Service with mock store
	scenarioSvc := createTestScenarioSvc()
	bankSvc := service.NewBankService(scenarioSvc)
	ctx := context.Background()

	sessionA := "session-user-A"
	sessionB := "session-user-B"
	fromAccID := domain.AccountID("ACCT-OP-1001") // Base balance 450,000
	toAccID := domain.AccountID("ACCT-ESC-2002")  // Base balance 125,000
	transferAmount := int64(50000)

	// 2. Initial state: Both sessions should see the same base balance
	balA_start, _ := bankSvc.GetAccountBalance(ctx, fromAccID, sessionA)
	balB_start, _ := bankSvc.GetAccountBalance(ctx, fromAccID, sessionB)

	if balA_start.Amount != 450000 || balB_start.Amount != 450000 {
		t.Fatalf("unexpected starting balance: A=%d, B=%d", balA_start.Amount, balB_start.Amount)
	}

	// 3. Perform Transfer for Session A
	// Note: The new logic will fork the scenario on the first UpdateAccount call.
	err := bankSvc.InitiateTransfer(ctx, fromAccID, toAccID, sessionA, transferAmount)
	if err != nil {
		t.Fatalf("transfer failed for session A: %v", err)
	}

	// 4. Verify Session A state is mutated
	balA_end, _ := bankSvc.GetAccountBalance(ctx, fromAccID, sessionA)
	toBalA_end, _ := bankSvc.GetAccountBalance(ctx, toAccID, sessionA)

	if balA_end.Amount != 400000 {
		t.Errorf("session A source account not deducted: expected 400000, got %d", balA_end.Amount)
	}
	if toBalA_end.Amount != 175000 {
		t.Errorf("session A target account not credited: expected 175000, got %d", toBalA_end.Amount)
	}

	// 5. Verify transactions were generated
	txsA, err := bankSvc.GetRecentTransactions(ctx, fromAccID, sessionA, 10)
	if err != nil {
		t.Fatalf("failed to get transactions for session A: %v", err)
	}

	foundDebit := false
	for _, tx := range txsA {
		if tx.Type == "Internal Transfer Out" && tx.Amount == -transferAmount {
			foundDebit = true
			if tx.ID == "" {
				t.Errorf("expected generated transaction to have an ID")
			}
			break
		}
	}
	if !foundDebit {
		t.Errorf("expected to find a debit transaction for the transfer")
	}

	// 6. CRITICAL: Verify Session B is UNCHANGED
	balB_end, _ := bankSvc.GetAccountBalance(ctx, fromAccID, sessionB)
	if balB_end.Amount != 450000 {
		t.Errorf("isolation failure: session B balance was affected by session A. expected 450000, got %d", balB_end.Amount)
	}
}
