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

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { InteractionMode } from '../components/LoginScreen';

export const SUPPORTED_LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'French', label: 'Français' },
  { value: 'Spanish', label: 'Español' },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['value'];

interface DemoConfigContextType {
  selectedPersona: string;
  setSelectedPersona: (personaId: string) => void;
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;
  languages: SupportedLanguage[];
  setLanguages: (langs: SupportedLanguage[]) => void;
  sessionId: string;
  resetSessionId: () => void;
  resumptionHandle: string | null;
  setResumptionHandle: (handle: string | null) => void;
}

const DemoConfigContext = createContext<DemoConfigContextType | undefined>(undefined);

export const DemoConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedPersona, setSelectedPersona] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('persona') || 'cre-advisor';
  });
  
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'heygen' || mode === 'google_1p' || mode === 'voice-only') {
      return mode as InteractionMode;
    }
    return 'google_1p';
  });

  const [languages, setLanguages] = useState<SupportedLanguage[]>(['English', 'French']);
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [resumptionHandle, setResumptionHandle] = useState<string | null>(null);

  const resetSessionId = useCallback(() => {
    setSessionId(crypto.randomUUID());
    setResumptionHandle(null);
  }, []);

  return (
    <DemoConfigContext.Provider
      value={{
        selectedPersona,
        setSelectedPersona,
        interactionMode,
        setInteractionMode,
        languages,
        setLanguages,
        sessionId,
        resetSessionId,
        resumptionHandle,
        setResumptionHandle,
      }}
    >
      {children}
    </DemoConfigContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDemoConfig = (): DemoConfigContextType => {
  const context = useContext(DemoConfigContext);
  if (context === undefined) {
    throw new Error('useDemoConfig must be used within a DemoConfigProvider');
  }
  return context;
};
