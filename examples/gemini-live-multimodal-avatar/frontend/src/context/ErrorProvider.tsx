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

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ErrorContext, type LogEntry } from './ErrorContext';

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((level: LogEntry['level'], message: string, details?: unknown) => {
    const logEntry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      level,
      message,
      details,
    };
    
    setLogs((prev) => [...prev, logEntry]);
    
    // Always log to console with debug level for standard visibility
    console.debug(`[Frontend ${level.toUpperCase()}] ${message}`, details || '');
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Intercept unhandled errors
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      addLog('error', 'Unhandled Exception', { message: event.message, filename: event.filename, lineno: event.lineno });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog('error', 'Unhandled Promise Rejection', { reason: event.reason });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addLog]);

  const value = useMemo(() => ({ logs, addLog, clearLogs }), [logs, addLog, clearLogs]);

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
  };