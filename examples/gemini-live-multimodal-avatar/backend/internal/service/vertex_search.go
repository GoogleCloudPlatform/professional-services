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
	"log/slog"
	"strings"
	"time"

	discoveryengine "cloud.google.com/go/discoveryengine/apiv1"
	"cloud.google.com/go/discoveryengine/apiv1/discoveryenginepb"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
	"live-api-rewrite-backend/internal/domain"
)

type vertexSearchServiceImpl struct {
	client *discoveryengine.SearchClient
	cfg    domain.VertexConfig
}

func NewVertexSearchService(ctx context.Context, cfg domain.VertexConfig) (domain.DocumentSearcher, error) {
	opts := []option.ClientOption{}
	if cfg.SearchLocation != "" && cfg.SearchLocation != "global" {
		region := cfg.SearchLocation
		// Map sub-regions to the supported regional endpoints (us or eu)
		if strings.HasPrefix(region, "us-") {
			region = "us"
		} else if strings.HasPrefix(region, "europe-") {
			region = "eu"
		}

		endpoint := fmt.Sprintf("%s-discoveryengine.googleapis.com:443", region)
		opts = append(opts, option.WithEndpoint(endpoint))
	}

	client, err := discoveryengine.NewSearchClient(ctx, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create discoveryengine client: %w", err)
	}

	return &vertexSearchServiceImpl{
		client: client,
		cfg:    cfg,
	}, nil
}

func FormatServingConfig(projectID, location, engineID string) string {
	// Serving config path: projects/{project}/locations/{location}/collections/default_collection/engines/{engine}/servingConfigs/default_search
	return fmt.Sprintf("projects/%s/locations/%s/collections/default_collection/engines/%s/servingConfigs/default_search",
		projectID, location, engineID)
}

func (s *vertexSearchServiceImpl) Search(ctx context.Context, query string) ([]domain.SearchResult, error) {
	region := s.cfg.SearchLocation
	if strings.HasPrefix(region, "us-") {
		region = "us"
	} else if strings.HasPrefix(region, "europe-") {
		region = "eu"
	}

	servingConfig := FormatServingConfig(s.cfg.ProjectID, region, s.cfg.EngineID)

	slog.Debug("Vertex Search Request", slog.String("serving_config", servingConfig), slog.String("query", query))

	req := &discoveryenginepb.SearchRequest{
		ServingConfig: servingConfig,
		Query:         query,
		PageSize:      2,
		ContentSearchSpec: &discoveryenginepb.SearchRequest_ContentSearchSpec{SnippetSpec: &discoveryenginepb.SearchRequest_ContentSearchSpec_SnippetSpec{
			ReturnSnippet: true,
		},
		},
	}

	start := time.Now()
	// Protect live voice avatar latency bounds by enforcing a strict maximum 3.0 second query timeout
	timeoutCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	it := s.client.Search(timeoutCtx, req)
	results := []domain.SearchResult{}

	for {
		resp, err := it.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			slog.Error("Vertex API Call Failed - Activating Graceful Local Fallback",
				slog.Duration("duration", time.Since(start)),
				slog.String("error", err.Error()),
				slog.String("query", query))

			// Return professional static placeholder information rather than bubbling a hard error.
			// This ensures the live interactive avatar can speak back a supportive status context to the user.
			return []domain.SearchResult{
				{
					Title:   "Wealth Management Information Hub",
					URL:     "https://www.example.com/wealth-management",
					Snippet: "The wealth management dynamic information database is temporarily offline for scheduled maintenance. All core advisor features are operating normally. Please connect directly with your dedicated Wealth Management Advisor or local banking centre for portfolio details.",
				},
			}, nil
		}

		doc := resp.Document
		if doc == nil {
			continue
		}

		result := domain.SearchResult{
			Title: doc.Id, // Fallback title
		}

		// Extract metadata from DerivedStructData if available
		if doc.DerivedStructData != nil {
			fields := doc.DerivedStructData.GetFields()
			if title, ok := fields["title"]; ok {
				result.Title = title.GetStringValue()
			}
			if link, ok := fields["link"]; ok {
				result.URL = link.GetStringValue()
			}
		}

		// Look for snippets
		if resp.Document.DerivedStructData != nil {
			if snippets, ok := resp.Document.DerivedStructData.GetFields()["snippets"]; ok && len(snippets.GetListValue().GetValues()) > 0 {
				if s, ok := snippets.GetListValue().GetValues()[0].GetStructValue().GetFields()["snippet"]; ok {
					result.Snippet = s.GetStringValue()
				}
			}
		}

		results = append(results, result)
	}

	slog.Info("Vertex API Call", slog.Duration("duration", time.Since(start)), slog.String("query", query), slog.Int("results", len(results)))
	return results, nil
}

func (s *vertexSearchServiceImpl) Close() error {
	if s.client != nil {
		return s.client.Close()
	}
	return nil
}
