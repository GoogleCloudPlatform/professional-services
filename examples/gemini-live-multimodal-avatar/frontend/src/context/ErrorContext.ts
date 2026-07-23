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

import { createContext, useContext } from 'react';

export type LogEntry = {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: unknown;
};

export interface ErrorContextType {
  logs: LogEntry[];
  addLog: (level: LogEntry['level'], message: string, details?: unknown) => void;
  clearLogs: () => void;
}

export const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}
