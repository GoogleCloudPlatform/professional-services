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

import { Box, Paper, Typography, Button, List, ListItem, ListItemText, Tooltip, Divider } from '@mui/material';
import { type ReactNode, memo, useMemo, useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useRouterState } from '@tanstack/react-router';
import { TelemetryRacetrack } from './TelemetryRacetrack';
import type { TelemetryMetrics } from '../types/telemetry';
import { formatLatency } from '../utils/telemetry';

interface TelemetrySidebarProps {
  children?: ReactNode;
}

const TurnHistoryList = memo(({ turns }: { turns: TelemetryMetrics[] }) => {
  return (
    <Box sx={{ mt: 2, flexGrow: 1, overflowY: 'auto' }}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, pl: 1, fontWeight: 'bold' }}>
        Recent History
      </Typography>
      <List dense>
        {turns.map((turn, index) => {
          return (
            <ListItem key={turn.turnId || index} divider sx={{ px: 1, py: 1 }}>
              <ListItemText
                primary={`Turn ${turns.length - index}`}
                secondary={`${turn.modelName?.split('/')[1] || 'Gemini'}`}
                primaryTypographyProps={{ variant: 'caption', fontWeight: 'bold' }}
                secondaryTypographyProps={{ variant: 'caption', sx: { fontSize: '0.65rem' } }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '80px' }}>
                <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: '0.7rem' }}>
                  {formatLatency(turn.totalTurnLatency)} <Typography component="span" variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>TTFW</Typography>
                </Typography>
                {(turn.inputTokens !== undefined || turn.outputTokens !== undefined) && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                    In: {turn.inputTokens || 0} | Out: {turn.outputTokens || 0}
                  </Typography>
                )}
              </Box>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
});
TurnHistoryList.displayName = 'TurnHistoryList';

const HeroMetricBox = ({ 
  label, 
  value, 
  color, 
  tooltip 
}: { 
  label: string, 
  value: string | number, 
  color: string, 
  tooltip: string 
}) => (
  <Box sx={{ textAlign: 'center', flex: 1 }}>
    <Tooltip title={tooltip} arrow placement="top">
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.5, fontWeight: 'bold', fontSize: '0.6rem', lineHeight: 1.2, display: 'block', mb: 0.5, cursor: 'help' }}>
        {label}
      </Typography>
    </Tooltip>
    <Typography 
      variant="h6" 
      component="div" 
      fontWeight="900"
      sx={{ 
          color, 
          transition: 'color 0.3s ease',
          fontSize: '0.9rem'
      }}
    >
      {value}
    </Typography>
  </Box>
);

// Memoize the Racetrack to prevent re-renders when history array updates
const MemoizedTelemetryRacetrack = memo(TelemetryRacetrack);

export const TelemetrySidebar = ({ children }: TelemetrySidebarProps) => {
  const { metrics, history, clearHistory } = useTelemetry();
  const routerState = useRouterState();
  
  const isVoiceOnly = routerState.location.pathname.includes('voice-only');

  // Track whether a turn is active
  const isTurnActive = metrics.turnStartTimestamp !== undefined && metrics.turnEndTimestamp === undefined;
  
  // Real-time ticking for active turns ONLY after the user stops speaking
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isTurnActive && metrics.userSilenceTimestamp) {
      interval = setInterval(() => setNow(Date.now()), 100);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isTurnActive, metrics.userSilenceTimestamp]);
  
  // 1. Identify all fully completed turns
  const fullyCompletedTurns = useMemo(() => {
    return history.filter(h => h.turnEndTimestamp !== undefined);
  }, [history]);

  const lastCompletedTurn = fullyCompletedTurns.length > 0 ? fullyCompletedTurns[fullyCompletedTurns.length - 1] : undefined;

  // 2. Determine the active display metrics for the Racetrack
  const displayMetrics = useMemo(() => {
    if (isTurnActive) {
        if (metrics.userSilenceTimestamp !== undefined) {
            return metrics; // Actively processing (user finished speaking)
        }
        return lastCompletedTurn || metrics; // User still speaking, hold old metrics on screen
    }
    return lastCompletedTurn || {}; // Turn finished, hold final metrics on screen
  }, [isTurnActive, metrics, lastCompletedTurn]);

  // 3. Rolling Average for TTFW
  const rollingAverage = useMemo(() => {
    const last5 = fullyCompletedTurns.slice(-5);
    const validTurnLatencies = last5.map(t => t.totalTurnLatency !== undefined ? t.totalTurnLatency : -1).filter(l => l >= 0);
    return validTurnLatencies.length > 0 
        ? validTurnLatencies.reduce((sum, lat) => sum + lat, 0) / validTurnLatencies.length 
        : undefined;
  }, [fullyCompletedTurns]);

  // 4. Token Calculations (Turn-Level Focus)
  // To avoid jitter and provide a stable UX for executives, we extract the tokens 
  // exclusively from the LAST COMPLETED TURN.
  const lastTurn = fullyCompletedTurns.length > 0 ? fullyCompletedTurns[fullyCompletedTurns.length - 1] : undefined;
  
  const turnInput = useMemo(() => lastTurn?.inputTokens || 0, [lastTurn]);
  const turnOutput = useMemo(() => lastTurn?.outputTokens || 0, [lastTurn]);

  // 5. History List (show all completed turns)
  const historyListTurns = useMemo(() => {
    return fullyCompletedTurns.slice().reverse();
  }, [fullyCompletedTurns]);

  const isLiveMetrics = displayMetrics === metrics && isTurnActive;
  
  // Wait Anchor: Only defined once the user stops speaking
  const waitAnchor = displayMetrics.userSilenceTimestamp;

  const isThinking = isLiveMetrics && waitAnchor !== undefined && displayMetrics.totalTurnLatency === undefined;

  // 2. Wait Time: Freezes when totalTurnLatency is set (First Byte/Word)
  // 2. Wait Latency (TTFW): Ticks from VAD_SILENCE until LLM_FIRST_BYTE
  const waitValue = displayMetrics.totalTurnLatency ?? 
      (isLiveMetrics && waitAnchor ? now - waitAnchor : undefined);

  const displayWait = formatLatency(waitValue);

  // 4. Average Wait Time
  const averageStatus = formatLatency(rollingAverage);

  return (
    <Paper
      elevation={4}
      sx={{
        width: 300,
        bgcolor: 'background.paper',
        borderLeft: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: 2,
        overflowY: 'auto',
        borderRadius: 0
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography 
          variant="caption" 
          component="h2" 
          color="text.secondary" 
          fontWeight="700" 
          sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem' }}
        >
          Wait Time Before {isVoiceOnly ? 'AI' : 'Avatar'} Speaks
        </Typography>
        <Button 
          size="small" 
          variant="text" 
          color="error" 
          onClick={clearHistory} 
          sx={{ fontSize: '0.6rem', p: 0, minWidth: 0, fontWeight: 700, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
        >
            Reset
        </Button>
      </Box>

      
      {/* HERO SCORECARD */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        <Box sx={{ 
          p: 1.5, 
          bgcolor: 'rgba(0,0,0,0.02)', 
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <HeroMetricBox 
            label="TTFW" 
            value={displayWait} 
            color="text.primary" 
            tooltip="Time to First Word: The perceived wait time from the moment you stop speaking to the exact moment the AI begins its reply." 
          />
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <HeroMetricBox 
            label="Avg TTFW" 
            value={averageStatus} 
            color="text.primary" 
            tooltip="Rolling average of the Time to First Word for the last 5 turns." 
          />
        </Box>
          <Box sx={{ 
            p: 1.5, 
            bgcolor: 'rgba(0,0,0,0.02)', 
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <HeroMetricBox 
              label="Turn In" 
              value={turnInput.toLocaleString()} 
              color="text.secondary" 
              tooltip="The context size of the last turn. This includes your voice (audio tokens), previous conversation history, and fetched data (tool results)." 
            />
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <HeroMetricBox 
              label="Turn Out" 
              value={turnOutput.toLocaleString()} 
              color="text.secondary" 
              tooltip="Tokens generated in the last turn. Note: Native Audio generates ~32 tokens per second of speech. This total includes Audio, Text, and Thinking/Reasoning tokens." 
            />
          </Box>
        </Box>
        <MemoizedTelemetryRacetrack metrics={displayMetrics} isThinking={isThinking} isVoiceOnly={isVoiceOnly} />
      
      {historyListTurns.length > 0 && (
        <TurnHistoryList turns={historyListTurns} />
      )}

      <Box sx={{ mt: 'auto' }}>
        {children}
      </Box>
    </Paper>
  );
};
