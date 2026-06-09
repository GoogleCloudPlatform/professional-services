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

//go:build integration

package service

import (
	"context"
	"os"
	"testing"
	"time"

	"live-api-rewrite-backend/internal/domain"

	"github.com/stretchr/testify/assert"
)

func TestVertexSearch_Integration(t *testing.T) {
	projectID := os.Getenv("VERTEX_PROJECT_ID")
	location := os.Getenv("VERTEX_LOCATION")
	engineID := os.Getenv("VERTEX_ENGINE_ID")

	if projectID == "" || location == "" || engineID == "" {
		t.Skip("Skipping integration test: VERTEX_PROJECT_ID, VERTEX_LOCATION, or VERTEX_ENGINE_ID not set")
	}

	cfg := domain.VertexConfig{
		ProjectID:      projectID,
		SearchLocation: location,
		EngineID:       engineID,
	}

	ctx := context.Background()
	svc, err := NewVertexSearchService(ctx, cfg)
	if err != nil {
		t.Fatalf("Failed to create VertexSearchService: %v", err)
	}
	defer svc.Close()

	start := time.Now()
	results, err := svc.Search(ctx, "Sunnyvale retail real estate")
	duration := time.Since(start)

	assert.NoError(t, err)

	// We expect at least some results if the data store is populated,
	// or at least a successful empty response if it's not.
	// But crucially, we must NOT exceed 2 results due to our PageSize optimization.
	assert.LessOrEqual(t, len(results), 2, "PageSize optimization regression: more than 2 results returned")

	t.Logf("Search returned %d results in %v", len(results), duration)
	for _, r := range results {
		t.Logf("Result: %s (%s)\nSnippet: %s", r.Title, r.URL, r.Snippet)
	}
}
