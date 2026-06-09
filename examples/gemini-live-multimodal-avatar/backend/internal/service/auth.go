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
	"fmt"
	"sync"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// AuthService defines the interface for fetching authentication tokens.
type AuthService interface {
	GetToken(ctx context.Context) (*oauth2.Token, error)
}

type authServiceImpl struct {
	tokenSource oauth2.TokenSource
	mu          sync.Mutex
}

// NewAuthService creates a new instance of AuthService.
func NewAuthService() AuthService {
	return &authServiceImpl{}
}

// GetToken returns an OAuth2 token.
// ARCHITECTURE NOTE: We use oauth2.ReuseTokenSource here instead of creating a new
// DefaultTokenSource on every request. Generating tokens involves a network call to
// Google's metadata server or IAM APIs, which is slow. ReuseTokenSource acts as an
// in-memory cache, automatically refreshing the token in the background only when it
// is within 1 minute of expiring, ensuring the /api/auth/token endpoint remains highly performant.
func (s *authServiceImpl) GetToken(ctx context.Context) (*oauth2.Token, error) {
	s.mu.Lock()
	if s.tokenSource == nil {
		// ARCHITECTURE FIX: We MUST use context.Background() here, not the request-scoped ctx.
		// google.DefaultTokenSource captures the context to use for all future HTTP calls
		// when refreshing the token. If we pass a request context, it gets canceled when the
		// HTTP request finishes, causing all future automatic token refreshes to fail with
		// "context canceled".
		ts, err := google.DefaultTokenSource(context.Background(), "https://www.googleapis.com/auth/cloud-platform")
		if err != nil {
			s.mu.Unlock()
			return nil, fmt.Errorf("failed to create default token source: %w", err)
		}
		// Wrap with ReuseTokenSource for automatic caching and refreshing
		s.tokenSource = oauth2.ReuseTokenSource(nil, ts)
	}
	ts := s.tokenSource
	s.mu.Unlock()

	return ts.Token()
}
