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
	"errors"
	"fmt"
	"log/slog"
	"time"

	"live-api-rewrite-backend/internal/domain"
)

type BankService interface {
	GetAccountBalance(ctx context.Context, accountID domain.AccountID, sessionID string) (domain.Money, error)
	GetRecentTransactions(ctx context.Context, accountID domain.AccountID, sessionID string, limit int) ([]domain.Transaction, error)
	InitiateTransfer(ctx context.Context, fromAccount domain.AccountID, toAccount domain.AccountID, sessionID string, amount int64) error
}

type bankServiceImpl struct {
	repo domain.AccountRepository
}

func NewBankService(repo domain.AccountRepository) BankService {
	return &bankServiceImpl{repo: repo}
}

func (s *bankServiceImpl) GetAccountBalance(ctx context.Context, accountID domain.AccountID, sessionID string) (domain.Money, error) {
	if accountID == "" {
		return domain.Money{}, errors.New("account ID cannot be empty")
	}

	acc, err := s.repo.GetAccount(ctx, accountID, sessionID)
	if err != nil {
		return domain.Money{}, err
	}

	return acc.Balance, nil
}

func (s *bankServiceImpl) GetRecentTransactions(ctx context.Context, accountID domain.AccountID, sessionID string, limit int) ([]domain.Transaction, error) {
	if accountID == "" {
		return nil, errors.New("account ID cannot be empty")
	}
	if limit < 0 {
		return nil, errors.New("limit cannot be negative")
	}
	if limit == 0 {
		limit = 10 // Default
	}

	return s.repo.GetTransactions(ctx, accountID, sessionID, limit)
}

func (s *bankServiceImpl) InitiateTransfer(ctx context.Context, fromAccount domain.AccountID, toAccount domain.AccountID, sessionID string, amount int64) error {
	if fromAccount == "" || toAccount == "" {
		return errors.New("both from and to accounts must be provided")
	}
	if amount <= 0 {
		return errors.New("transfer amount must be positive")
	}

	slog.Info("Initiating transfer",
		slog.String("from", string(fromAccount)),
		slog.String("to", string(toAccount)),
		slog.Int64("amount", amount),
		slog.String("session", sessionID))

	fromAcc, err := s.repo.GetAccount(ctx, fromAccount, sessionID)
	if err != nil {
		return err
	}

	toAcc, err := s.repo.GetAccount(ctx, toAccount, sessionID)
	if err != nil {
		return err
	}

	if fromAcc.Balance.Amount < amount {
		slog.Error("Transfer failed: insufficient funds", slog.Int64("requested", amount), slog.Int64("available", fromAcc.Balance.Amount))
		return errors.New("insufficient funds")
	}

	fromAcc.Balance.Amount -= amount
	toAcc.Balance.Amount += amount

	if err := s.repo.UpdateAccount(ctx, fromAcc, sessionID); err != nil {
		slog.Error("Failed to update fromAccount", slog.String("error", err.Error()))
		return err
	}
	if err := s.repo.UpdateAccount(ctx, toAcc, sessionID); err != nil {
		slog.Error("Failed to update toAccount", slog.String("error", err.Error()))
		return err
	}

	// Log transactions
	importTime := time.Now().Format(time.RFC3339)
	txID := fmt.Sprintf("TX-TRF-%d", time.Now().UnixNano())

	debitTx := domain.Transaction{
		ID:        txID + "-OUT",
		AccountID: string(fromAccount),
		Date:      importTime,
		Type:      "Internal Transfer Out",
		Amount:    -amount,
		Currency:  fromAcc.Balance.Currency,
	}
	creditTx := domain.Transaction{
		ID:        txID + "-IN",
		AccountID: string(toAccount),
		Date:      importTime,
		Type:      "Internal Transfer In",
		Amount:    amount,
		Currency:  toAcc.Balance.Currency,
	}

	if err := s.repo.AddTransaction(ctx, debitTx, sessionID); err != nil {
		slog.Error("Failed to log debit transaction", slog.String("error", err.Error()))
	}
	if err := s.repo.AddTransaction(ctx, creditTx, sessionID); err != nil {
		slog.Error("Failed to log credit transaction", slog.String("error", err.Error()))
	}

	slog.Info("Transfer completed successfully")
	return nil
}
