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

import { Box, Typography, Paper, Tooltip, Divider, LinearProgress } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { TelemetryMetrics } from '../types/telemetry';
import { formatLatency, getLatencyColorName, calculateRacetrackSegments } from '../utils/telemetry';

interface TelemetryRacetrackProps {
  metrics: TelemetryMetrics;
  isThinking?: boolean;
  isVoiceOnly?: boolean;
}

const MetricRow = ({ label, value, tooltip, color, isStale }: { label: string, value: string, tooltip: string, color?: string, isStale?: boolean }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Color Badge Legend */}
            {color && (
                <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: isStale ? 'action.disabledBackground' : color,
                    flexShrink: 0
                }} />
            )}
            <Typography variant="caption" color={isStale ? "text.disabled" : "text.secondary"} sx={{ fontWeight: 500 }}>{label}</Typography>
            <Tooltip title={tooltip} arrow placement="top">
                <InfoOutlinedIcon sx={{ fontSize: 12, color: isStale ? "text.disabled" : "text.secondary", cursor: 'help' }} />
            </Tooltip>
        </Box>
        <Typography variant="caption" sx={{ color: isStale ? 'text.disabled' : (color || 'text.primary'), fontWeight: value !== '--' && !isStale ? 'bold' : 'regular', transition: 'color 0.3s' }}>
            {value}
        </Typography>
    </Box>
);

export const TelemetryRacetrack = ({ metrics, isThinking, isVoiceOnly }: TelemetryRacetrackProps) => {
  const {
    inputDuration,
    geminiDuration,
    toolDuration,
    playbackDuration,
    totalResponseTime
  } = calculateRacetrackSegments(metrics);

  // Percentage calculation for the bar (include VAD in the max scaler)
  const maxLatency = Math.max(totalResponseTime, 2000); // Scale bar to at least 2.0s
  const getWidth = (val: number) => `${(val / maxLatency) * 100}%`;

  if (!metrics.turnId && !isThinking) return (
    <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
      <Typography variant="caption">Ready for turn...</Typography>
    </Box>
  );

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
        Racetrack Sequence
      </Typography>

      {/* THE RACETRACK BAR */}
      <Box sx={{ 
        width: '100%', 
        height: 12, 
        bgcolor: 'action.hover', 
        borderRadius: 6, 
        overflow: 'hidden', 
        display: 'flex', 
        mb: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        {/* Input Segment (Grey) */}
        <Box sx={{ width: getWidth(inputDuration), height: '100%', bgcolor: '#E0E0E0', transition: 'width 0.5s ease-out' }} />
        
        {/* LLM Segment (Deep Burgundy) with Nested Async Tool Overlay (Orange Striped) */}
        <Box sx={{ width: getWidth(geminiDuration), height: '100%', bgcolor: 'secondary.main', transition: 'width 0.5s ease-out', position: 'relative' }}>
          {toolDuration > 0 && geminiDuration > 0 && (
            <Box sx={{ 
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${Math.min(100, (toolDuration / geminiDuration) * 100)}%`,
              bgcolor: '#FF9800',
              backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.25) 4px, transparent 4px, transparent 8px)',
              borderRight: '1px solid rgba(0,0,0,0.1)'
            }} />
          )}
        </Box>
        
        {/* Playback Segment (Primary Theme) */}
        <Box sx={{ width: getWidth(playbackDuration), height: '100%', bgcolor: 'primary.main', transition: 'width 0.5s ease-out' }} />
      </Box>

      {/* DETAILED BREAKDOWN */}
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
          {metrics.interruptionLatency && (
              <MetricRow 
                label="Voice Detection Window" 
                value={formatLatency(metrics.interruptionLatency)} 
                tooltip="The fraction of a second it takes the local microphone to realize you are speaking so it can instantly pause the AI." 
                color="#f44336" // Red/Warning color for interruption
                isStale={false} 
              />
          )}
          <MetricRow 
            label="Gemini Processing & Pacing" 
            value={formatLatency(inputDuration + geminiDuration)} 
            tooltip="The time Gemini takes to formulate an answer. It intentionally pauses for a fraction of a second before replying to create a natural, conversational rhythm." 
            color="secondary.main" 
            isStale={isThinking} 
          />
          {toolDuration > 0 && (
              <MetricRow 
                label="Tool Fetching" 
                value={formatLatency(toolDuration)} 
                tooltip="Time spent retrieving live data or executing actions. This happens in the background while Gemini is thinking, adding zero extra wait time for the user." 
                color="#FF9800" 
                isStale={isThinking} 
              />
          )}
          <MetricRow 
            label={isVoiceOnly ? "Audio Playback" : "Avatar Rendering"} 
            value={formatLatency(playbackDuration)} 
            tooltip={isVoiceOnly ? "Time required to decode and play the audio response." : "Time required to generate and stream the lip-synced video and audio back to your screen."} 
            color="primary.main" 
            isStale={isThinking} 
          />
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5 }}>
              <Typography variant="caption" fontWeight="bold">Total Wait Time</Typography>
              <Typography variant="caption" fontWeight="bold" color={getLatencyColorName(totalResponseTime)}>
                  {formatLatency(totalResponseTime)}
              </Typography>
          </Box>

          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', display: 'block', mt: 1, px: 0.5, lineHeight: 1.2, fontSize: '0.65rem' }}>
            Note: Component latencies execute concurrently and do not sum to the total wait time.
          </Typography>
      </Paper>

      {isThinking && <LinearProgress sx={{ mt: 1, height: 2, borderRadius: 1 }} color="primary" />}
    </Box>
  );
};
