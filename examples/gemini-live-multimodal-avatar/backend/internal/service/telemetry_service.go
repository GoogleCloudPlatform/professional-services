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
	"encoding/csv"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sync"

	"cloud.google.com/go/logging"
)

type TelemetryService interface {
	Push(history []map[string]interface{})
	Close()
}

type telemetryService struct {
	channel   chan []map[string]interface{}
	wg        sync.WaitGroup
	filePath  string
	logClient *logging.Client
	logger    *logging.Logger
}

func NewTelemetryService(ctx context.Context, workspaceRoot, projectID string) TelemetryService {
	filePath := filepath.Join(workspaceRoot, "telemetry_logs.csv")

	svc := &telemetryService{
		channel:  make(chan []map[string]interface{}, 100), // Buffered channel
		filePath: filePath,
	}

	// Initialize Cloud Logging client if projectID is provided AND we are running in Cloud Run
	if projectID != "" && os.Getenv("K_SERVICE") != "" {
		client, err := logging.NewClient(ctx, projectID)
		if err != nil {
			slog.Warn("Failed to initialize Cloud Logging client. Falling back to CSV only.", slog.String("error", err.Error()))
		} else {
			svc.logClient = client
			svc.logger = client.Logger("avatar-telemetry")
			slog.Info("Cloud Logging initialized for telemetry", slog.String("project_id", projectID))
		}
	} else {
		slog.Info("Running locally (K_SERVICE not set). Cloud Logging disabled, using CSV only.")
	}

	// Initialize CSV if it doesn't exist
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		file, err := os.Create(filePath)
		if err == nil {
			defer file.Close()
			writer := csv.NewWriter(file)
			writer.Write([]string{"TurnID", "Timestamp", "AudioMode", "MetricKey", "MetricValue", "ToolName", "UserText", "ModelText"})
			writer.Flush()
		}
	}

	svc.wg.Add(1)
	go svc.run()

	return svc
}

func (s *telemetryService) Push(history []map[string]interface{}) {
	select {
	case s.channel <- history:
		// Success
	default:
		slog.Warn("Telemetry channel full, dropping events")
	}
}

func (s *telemetryService) Close() {
	close(s.channel)
	s.wg.Wait()
	if s.logClient != nil {
		s.logger.Flush()
		s.logClient.Close()
	}
}

func (s *telemetryService) run() {
	defer s.wg.Done()

	for history := range s.channel {
		// Log to Cloud Logging if available
		if s.logger != nil {
			for _, h := range history {
				s.logger.Log(logging.Entry{
					Severity: logging.Info,
					Payload:  h,
				})
			}
		}

		file, err := os.OpenFile(s.filePath, os.O_APPEND|os.O_WRONLY, 0644)
		if err != nil {
			slog.Error("Failed to open telemetry file for writing", slog.String("error", err.Error()))
			continue
		}

		writer := csv.NewWriter(file)

		for _, h := range history {
			turnID := fmt.Sprintf("%v", h["turnId"])
			timestamp := fmt.Sprintf("%v", h["timestamp"])
			audioMode := ""
			if am, ok := h["audioMode"]; ok && am != nil {
				audioMode = fmt.Sprintf("%v", am)
			}

			userText := ""
			if ut, ok := h["userText"]; ok && ut != nil {
				userText = fmt.Sprintf("%v", ut)
			}

			modelText := ""
			if mt, ok := h["modelText"]; ok && mt != nil {
				modelText = fmt.Sprintf("%v", mt)
			}

			// We write each metric key as a separate row to keep it clean CSV
			for k, v := range h {
				if k == "turnId" || k == "timestamp" || k == "toolExecutions" || k == "audioMode" || k == "userText" || k == "modelText" {
					continue
				}
				writer.Write([]string{turnID, timestamp, audioMode, k, fmt.Sprintf("%v", v), "", userText, modelText})
			}

			// Tool executions
			if tools, ok := h["toolExecutions"].([]interface{}); ok {
				for _, t := range tools {
					if toolMap, ok := t.(map[string]interface{}); ok {
						toolName := fmt.Sprintf("%v", toolMap["toolName"])
						latency := fmt.Sprintf("%v", toolMap["latency"])
						writer.Write([]string{turnID, timestamp, audioMode, "toolExecutionLatency", latency, toolName, userText, modelText})
					}
				}
			}

			// If this is a final turn summary (has turnEndTimestamp) but no other metrics were written
			// (rare, but possible), or we just want a dedicated row for the text:
			if _, hasEnd := h["turnEndTimestamp"]; hasEnd {
				writer.Write([]string{turnID, timestamp, audioMode, "conversation_summary", "", "", userText, modelText})
			}
		}

		writer.Flush()
		file.Close()
	}
}
