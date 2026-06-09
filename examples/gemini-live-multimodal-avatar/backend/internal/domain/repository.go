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

import "context"

// AccountRepository defines how the system retrieves account and transaction data.
// This decouples domain services (like BankService) from specific data sources (like Mock Scenarios or Databases).
type AccountRepository interface {
	GetAccount(ctx context.Context, id AccountID, sessionID string) (Account, error)
	GetTransactions(ctx context.Context, id AccountID, sessionID string, limit int) ([]Transaction, error)
	UpdateAccount(ctx context.Context, account Account, sessionID string) error
	AddTransaction(ctx context.Context, transaction Transaction, sessionID string) error
}
