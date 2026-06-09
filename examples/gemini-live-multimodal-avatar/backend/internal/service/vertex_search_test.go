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

	"github.com/stretchr/testify/assert"
	"live-api-rewrite-backend/internal/domain"
)

func TestVertexSearch_Mock(t *testing.T) {
	mockResults := []domain.SearchResult{
		{
			Title:   "Investment Basics",
			Snippet: "Learn the fundamentals of investing.",
			URL:     "http://example.com/investing",
		},
	}

	mock := &MockSearcher{
		SearchFunc: func(ctx context.Context, query string) ([]domain.SearchResult, error) {
			if query == "investing" {
				return mockResults, nil
			}
			return nil, nil
		},
	}

	ctx := context.Background()

	// Test success
	results, err := mock.Search(ctx, "investing")
	assert.NoError(t, err)
	assert.Len(t, results, 1)
	assert.Equal(t, "Investment Basics", results[0].Title)

	// Test no results
	results, err = mock.Search(ctx, "something else")
	assert.NoError(t, err)
	assert.Nil(t, results)
}

func TestFormatServingConfig(t *testing.T) {
	projectID := "my-test-project"
	location := "global"
	engineID := "search-engine-123"

	expected := "projects/my-test-project/locations/global/collections/default_collection/engines/search-engine-123/servingConfigs/default_search"
	actual := FormatServingConfig(projectID, location, engineID)

	assert.Equal(t, expected, actual, "Serving config path should match the required Vertex AI format")
}

// NOTE: Integration tests for vertex_search_service would go here with //go:build integration
// They would require a real GCP environment and ADC.
