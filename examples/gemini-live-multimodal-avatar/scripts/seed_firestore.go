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

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

func main() {
	projectID := os.Getenv("VERTEX_PROJECT_ID")
	if projectID == "" {
		slog.Error("VERTEX_PROJECT_ID environment variable is required")
		os.Exit(1)
	}

	ctx := context.Background()
	client, err := firestore.NewClient(ctx, projectID)
	if err != nil {
		slog.Error("Failed to create firestore client", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer client.Close()

	scenariosDir := "data/scenarios"
	files, err := os.ReadDir(scenariosDir)
	if err != nil {
		slog.Error("Could not read scenarios directory", slog.String("dir", scenariosDir), slog.String("error", err.Error()))
		os.Exit(1)
	}

	localIDs := make(map[string]bool)
	for _, file := range files {
		if filepath.Ext(file.Name()) == ".json" {
			path := filepath.Join(scenariosDir, file.Name())
			data, err := os.ReadFile(path)
			if err != nil {
				slog.Error("Error reading local scenario file", slog.String("file", path), slog.String("error", err.Error()))
				continue
			}

			var scenario map[string]interface{}
			if err := json.Unmarshal(data, &scenario); err != nil {
				slog.Error("Error parsing local scenario JSON", slog.String("file", path), slog.String("error", err.Error()))
				continue
			}

			id := strings.TrimSuffix(file.Name(), filepath.Ext(file.Name()))
			scenario["id"] = id // Ensure ID matches filename
			localIDs[id] = true

			_, err = client.Collection("base_scenarios").Doc(id).Set(ctx, scenario)
			if err != nil {
				slog.Error("Failed to seed scenario to Firestore", slog.String("id", id), slog.String("error", err.Error()))
			} else {
				slog.Info("Successfully seeded scenario to Firestore", slog.String("id", id))
			}
		}
	}

	// Clean up deleted scenarios from Firestore
	slog.Info("Cleaning up stale scenarios from Firestore...")
	iter := client.Collection("base_scenarios").Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			slog.Error("Failed to iterate firestore documents", slog.String("error", err.Error()))
			break
		}
		id := doc.Ref.ID
		if !localIDs[id] {
			_, err := doc.Ref.Delete(ctx)
			if err != nil {
				slog.Error("Failed to delete stale scenario from Firestore", slog.String("id", id), slog.String("error", err.Error()))
			} else {
				slog.Info("Successfully deleted stale scenario from Firestore", slog.String("id", id))
			}
		}
	}
	fmt.Println("Done seeding and cleaning Firestore.")
}
