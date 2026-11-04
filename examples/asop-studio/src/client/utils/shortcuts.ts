// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export interface Shortcut {
  key: string;       // Lowercase key name, e.g. 'z'
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  cmdOrCtrl?: boolean; // True if it should map to Cmd on Mac and Ctrl on other platforms
}

// Configurable keyboard shortcuts mapping
export const shortcutMappings: Record<string, Shortcut> = {
  undo: {
    key: 'z',
    cmdOrCtrl: true,
  },
  redo: {
    key: 'z',
    cmdOrCtrl: true,
    shiftKey: true,
  },
};

type KeyboardEventLike = KeyboardEvent | ReactKeyboardEvent<any>;

/**
 * Checks if a keyboard event matches a configured shortcut.
 */
export function matchesShortcut(event: KeyboardEventLike, shortcut: Shortcut): boolean {
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  const isMac = typeof window !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent || '');
  
  const hasCmdOrCtrl = shortcut.cmdOrCtrl 
    ? (isMac ? event.metaKey : event.ctrlKey)
    : true;

  if (shortcut.cmdOrCtrl && !hasCmdOrCtrl) {
    return false;
  }

  if (shortcut.cmdOrCtrl) {
    if (isMac && event.ctrlKey) return false;
    if (!isMac && event.metaKey) return false;
  } else {
    if (!!shortcut.ctrlKey !== event.ctrlKey) return false;
    if (!!shortcut.metaKey !== event.metaKey) return false;
  }

  if (!!shortcut.shiftKey !== event.shiftKey) return false;
  if (!!shortcut.altKey !== event.altKey) return false;

  return true;
}

/**
 * Returns true if the keyboard event originated from an input, textarea, or contenteditable element.
 */
export function isTypingEvent(event: KeyboardEventLike): boolean {
  const target = event.target as HTMLElement;
  if (!target) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  );
}
