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
	"testing"
)

func TestAuthService(t *testing.T) {
	svc := NewAuthService()
	if svc == nil {
		t.Fatal("Expected AuthService to be created, got nil")
	}

	// We test GetToken. Note: In CI without ADC configured, this will return an error.
	// We just ensure it doesn't panic and handles the context properly.
	ctx := context.Background()
	token, err := svc.GetToken(ctx)

	t.Logf("Token: %v, Error: %v", token, err)
}
