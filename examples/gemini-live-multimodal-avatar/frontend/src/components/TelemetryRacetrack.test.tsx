/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TelemetryRacetrack } from './TelemetryRacetrack';
import type { TelemetryMetrics } from '../types/telemetry';

describe('TelemetryRacetrack Component', () => {
  it('renders chronological segments based on provided metrics', () => {
    const mockMetrics: TelemetryMetrics = {
      turnId: 'test_1',
      totalTurnLatency: 800,
      aiProcessingLatency: 250,
      ttsProcessingLatency: 300,
      toolExecutions: [],
      modelName: 'gemini-3.1-flash-live-preview'
    };

    render(<TelemetryRacetrack metrics={mockMetrics} />);

    // Assert that the segment labels are rendered
    expect(screen.getByText(/Gemini Processing & Pacing/i)).toBeInTheDocument();
    expect(screen.getByText(/Avatar Rendering/i)).toBeInTheDocument();
  });

  it('renders a nested concurrent overlay when toolExecutions are present', () => {
    const mockMetricsWithTools: TelemetryMetrics = {
      turnId: 'test_2',
      totalTurnLatency: 1000,
      aiProcessingLatency: 400, // TTFB = 400ms
      ttsProcessingLatency: 200,
      toolExecutions: [{ toolName: 'check_balance', latency: 150, timestamp: 12345 }]
    };

    const { container } = render(<TelemetryRacetrack metrics={mockMetricsWithTools} />);

    // Assert that the label is present in the text breakdown
    expect(screen.getByText(/Tool Fetching/i)).toBeInTheDocument();

    // Assert that the nested striped orange bar is rendered inside the visual Racetrack
    // (We look for the Box with the repeating-linear-gradient and orange bg color)
    const overlayElement = container.querySelector('[style*="bgcolor: #FF9800"]');
    expect(overlayElement).toBeDefined();

    // Verify it doesn't hide the overall Racetrack sequence title
    expect(screen.getByText(/Racetrack Sequence/i)).toBeInTheDocument();
  });

  it('renders an empty state when no turn has completed', () => {
    render(<TelemetryRacetrack metrics={{}} />);
    expect(screen.getByText(/Ready for turn/i)).toBeInTheDocument();
  });
});