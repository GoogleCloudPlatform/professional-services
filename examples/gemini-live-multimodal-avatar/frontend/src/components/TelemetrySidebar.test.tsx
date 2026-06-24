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

import { describe, beforeEach, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TelemetrySidebar } from './TelemetrySidebar';
import * as TelemetryContext from '../context/TelemetryContext';
import * as DemoConfigContext from '../context/DemoConfigContext';

let mockPathname = '/advisor/heygen';

vi.mock('@tanstack/react-router', () => ({
  useRouterState: vi.fn(() => ({
    location: { pathname: mockPathname }
  })),
}));


// Mock the context hook
vi.mock('../context/TelemetryContext', () => ({
  useTelemetry: vi.fn(),
}));

vi.mock('../context/DemoConfigContext', () => ({
  useDemoConfig: vi.fn(),
}));

// Mock the TelemetryRacetrack component
vi.mock('./TelemetryRacetrack', () => ({
  TelemetryRacetrack: ({ metrics }: { metrics: unknown }) => <div data-testid="mock-racetrack" data-metrics={JSON.stringify(metrics)} />
}));

describe('TelemetrySidebar Component', () => {
  beforeEach(() => {
    mockPathname = '/advisor/heygen';
  });

  const baseContext = {
    metrics: {},
    history: [],
    recordMetric: vi.fn(),
    startTurn: vi.fn(),
    cancelTurn: vi.fn(),
    clearHistory: vi.fn(),
    setModelName: vi.fn(),
    userSilenceTimestampRef: { current: 0 } as React.MutableRefObject<number>,
  };

  const baseDemoConfig = { sessionId: "test-session", resetSessionId: vi.fn(),
    selectedPersona: 'cre-advisor',
    setSelectedPersona: vi.fn(),
    interactionMode: 'heygen' as const,
    setInteractionMode: vi.fn(),
    languages: ['English'] as ('English' | 'Spanish')[],
    setLanguages: vi.fn(),
    resumptionHandle: null,
    setResumptionHandle: vi.fn(),
    customAvatar: null,
    setCustomAvatar: vi.fn(),
    customVoice: null,
    setCustomVoice: vi.fn(),
    customLanguageCode: null,
    setCustomLanguageCode: vi.fn()
  };

  it('renders without P99 charts or P99 terminology', () => {
    vi.spyOn(TelemetryContext, 'useTelemetry').mockReturnValue(baseContext);
    vi.spyOn(DemoConfigContext, 'useDemoConfig').mockReturnValue(baseDemoConfig);
    render(<TelemetrySidebar />);
    
    // Assert P99 elements are completely removed
    expect(screen.queryByText(/P99/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId(/chart-/i)).not.toBeInTheDocument();
  });

  it('renders the Hero Score display based on the most recent totalTurnLatency', () => {
    vi.spyOn(TelemetryContext, 'useTelemetry').mockReturnValue({
      ...baseContext,
      history: [{ totalTurnLatency: 550, ttsProcessingLatency: 100, userSilenceTimestamp: 1000 }],
      metrics: { turnStartTimestamp: 1000, userSilenceTimestamp: 1000, totalTurnLatency: 550, ttsProcessingLatency: 100, aiProcessingLatency: 100 }
    });
    vi.spyOn(DemoConfigContext, 'useDemoConfig').mockReturnValue(baseDemoConfig);

    render(<TelemetrySidebar />);

    expect(screen.getByText('TTFW')).toBeInTheDocument();
    expect(screen.getByText('Turn In')).toBeInTheDocument();
    expect(screen.getByText('Turn Out')).toBeInTheDocument();
    expect(screen.getAllByText(/550ms/i).length).toBeGreaterThan(0);
  });

  it('calculates tokens strictly from the last completed turn to prevent UI jitter', () => {
    vi.spyOn(TelemetryContext, 'useTelemetry').mockReturnValue({
      ...baseContext,
      // The history array contains one completed turn and the CURRENT streaming turn
      history: [
        { turnId: '1', totalTurnLatency: 500, turnEndTimestamp: 1500, inputTokens: 1000, outputTokens: 50, totalTokens: 1050 }, // Completed
        { turnId: '2', inputTokens: 1500, outputTokens: 10, totalTokens: 1510 }  // Active/Streaming turn (has no totalTurnLatency or turnEndTimestamp yet)
      ],
      // The active metrics object matches the streaming turn
      metrics: { turnId: '2', turnStartTimestamp: 1000, inputTokens: 1500, outputTokens: 10, totalTokens: 1510 }
    });
    vi.spyOn(DemoConfigContext, 'useDemoConfig').mockReturnValue(baseDemoConfig);

    render(<TelemetrySidebar />);

    // It should read inputTokens from the LAST COMPLETED turn (1000) and ignore the active turn's (1500)
    const inBox = screen.getByText('Turn In').parentElement;
    expect(inBox?.textContent).toContain('1,000');
    expect(inBox?.textContent).not.toContain('2,500'); 
    
    // It should read outputTokens from the LAST COMPLETED turn (50) and ignore the active turn's (10)
    const outBox = screen.getByText('Turn Out').parentElement;
    expect(outBox?.textContent).toContain('50');
    expect(outBox?.textContent).not.toContain('60'); 
  });

  it('renders processing status correctly', () => {
    vi.spyOn(TelemetryContext, 'useTelemetry').mockReturnValue({
      ...baseContext,
      metrics: { turnStartTimestamp: 1000 } // Missing latency numbers means it's still processing
    });
    vi.spyOn(DemoConfigContext, 'useDemoConfig').mockReturnValue(baseDemoConfig);
    const { rerender } = render(<TelemetrySidebar />);

    // Since we removed 'Processing...', check for '--' as the default displayStatus when no history exists
    expect(screen.getAllByText(/--/i).length).toBeGreaterThan(0);

    // Now complete the turn
    vi.spyOn(TelemetryContext, 'useTelemetry').mockReturnValue({
      ...baseContext,
      history: [{ totalTurnLatency: 1550, userSilenceTimestamp: 1000 }],
      metrics: { turnStartTimestamp: 1000, userSilenceTimestamp: 1000, totalTurnLatency: 1550, ttsProcessingLatency: 100, aiProcessingLatency: 100 }
    });
    rerender(<TelemetrySidebar />);

    expect(screen.getAllByText(/1550ms/i).length).toBeGreaterThan(0);
  });

  it('renders "--" for TTFW when the user is actively speaking', () => {
    const liveMetrics = { turnId: 'current', turnStartTimestamp: 1000, userSilenceTimestamp: 1100, aiProcessingLatency: 120 };
    vi.spyOn(TelemetryContext, 'useTelemetry').mockReturnValue({
      ...baseContext,
      metrics: liveMetrics,
      history: [{ turnId: 'prev', totalTurnLatency: 500, userSilenceTimestamp: 1000 }] // Previous turn
    });
    vi.spyOn(DemoConfigContext, 'useDemoConfig').mockReturnValue(baseDemoConfig);

    render(<TelemetrySidebar />);

    const racetrack = screen.getByTestId('mock-racetrack');
    expect(racetrack).toBeInTheDocument();
    // Should contain current turn's live metrics, not previous turn's 500ms
    expect(racetrack.getAttribute('data-metrics')).toContain('"aiProcessingLatency":120');
    expect(racetrack.getAttribute('data-metrics')).not.toContain('"totalTurnLatency":500');
  });

  it('integrates the TelemetryRacetrack with the current metrics', () => {
    const testMetrics = { turnId: '1', totalTurnLatency: 550, aiProcessingLatency: 150, userSilenceTimestamp: 1000, turnEndTimestamp: 1550 };
    vi.spyOn(TelemetryContext, 'useTelemetry').mockReturnValue({
      ...baseContext,
      metrics: { ...testMetrics, turnId: '2' }, // Ensure active turn has a different ID so the history item is seen as 'completed'
      history: [testMetrics]
    });
    vi.spyOn(DemoConfigContext, 'useDemoConfig').mockReturnValue(baseDemoConfig);

    render(<TelemetrySidebar />);
    
    const racetrack = screen.getByTestId('mock-racetrack');
    expect(racetrack).toBeInTheDocument();
    // The active racetrack should display the 550ms TTFB from the current metrics.
    expect(racetrack.getAttribute('data-metrics')).toContain('"totalTurnLatency":550');
  });

  it('calculates and displays the rolling average of the last 5 turns', () => {
    vi.spyOn(TelemetryContext, 'useTelemetry').mockReturnValue({
      ...baseContext,
      history: [
        { turnId: '1', totalTurnLatency: 100, userSilenceTimestamp: 1000, turnEndTimestamp: 1100 },
        { turnId: '2', totalTurnLatency: 200, userSilenceTimestamp: 1000, turnEndTimestamp: 1200 },
        { turnId: '3', totalTurnLatency: 300, userSilenceTimestamp: 1000, turnEndTimestamp: 1300 },
        { turnId: '4', totalTurnLatency: 400, userSilenceTimestamp: 1000, turnEndTimestamp: 1400 },
        { turnId: '5', totalTurnLatency: 500, userSilenceTimestamp: 1000, turnEndTimestamp: 1500 }
      ],
      metrics: { turnId: '6', totalTurnLatency: 500, userSilenceTimestamp: 1000 }
    });
    vi.spyOn(DemoConfigContext, 'useDemoConfig').mockReturnValue(baseDemoConfig);

    render(<TelemetrySidebar />);

    // Average of 100, 200, 300, 400, 500 is 300
    // It appears twice: once in Scorecard (Average) and once in History (Turn 3)
    expect(screen.getAllByText(/300ms/i).length).toBe(2);
  });

  it('renders "--" for TTFW when the user is actively speaking', () => {
    vi.spyOn(TelemetryContext, 'useTelemetry').mockReturnValue({
      ...baseContext,
      metrics: {
        turnStartTimestamp: 1000,
        // Notice: NO userSilenceTimestamp or turnEndTimestamp
      }
    });
    vi.spyOn(DemoConfigContext, 'useDemoConfig').mockReturnValue(baseDemoConfig);

    render(<TelemetrySidebar />);

    const waitBox = screen.getByText('TTFW').parentElement;
    expect(waitBox?.textContent).toContain('--');
  });

  it('changes header text based on voice-only interaction mode', () => {
    mockPathname = '/advisor/voice-only';
    vi.spyOn(TelemetryContext, 'useTelemetry').mockReturnValue(baseContext);
    vi.spyOn(DemoConfigContext, 'useDemoConfig').mockReturnValue({
      ...baseDemoConfig,
      interactionMode: 'voice-only'
    });

    render(<TelemetrySidebar />);
    expect(screen.getByText(/Wait Time Before AI Speaks/i)).toBeInTheDocument();
  });
});
