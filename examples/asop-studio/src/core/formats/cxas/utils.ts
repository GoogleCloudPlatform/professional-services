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

export function mapSopTypeToCxas(sopType: string): string {
  if (!sopType) return 'STRING';
  const typeLower = sopType.toLowerCase();
  if (typeLower === 'int' || typeLower === 'float') {
    return 'NUMBER';
  }
  if (typeLower === 'bool') {
    return 'BOOLEAN';
  }
  return 'STRING'; // default for string or enum[...]
}

export function mapVariableReferences(text: string, variablesMap: Map<string, string>): string {
  let mapped = text;
  variablesMap.forEach((_, name) => {
    const regex = new RegExp(`\\{?\\b(?!sop__)${name}\\b\\}?`, 'g');
    mapped = mapped.replace(regex, `{sop__${name}}`);
  });
  return mapped;
}

export function sanitizeResourceId(id: string, maxLen: number = 36): string {
  let cleaned = id.toLowerCase().replace(/[^a-z0-9-_]/g, '_');
  cleaned = cleaned.replace(/^[^a-z0-9]+/, '');
  if (!cleaned) {
    cleaned = 'resource';
  }
  if (cleaned.length > maxLen) {
    const candidate = cleaned.substring(0, maxLen);
    const lastBoundary = Math.max(candidate.lastIndexOf('_'), candidate.lastIndexOf('-'));
    if (lastBoundary > 0) {
      cleaned = candidate.substring(0, lastBoundary).replace(/[-_]+$/, '');
    } else {
      cleaned = candidate.replace(/[-_]+$/, '');
    }
    if (!cleaned) {
      cleaned = candidate;
    }
  }
  while (cleaned.length < 5) {
    cleaned += '_';
  }
  return cleaned;
}

/**
 * Trims and sanitizes a flow ID to generate a valid CXAS flow-prefixed enter_node tool name.
 * CXAS tool resource IDs must match '[a-zA-Z0-9][a-zA-Z0-9-_]{4,35}' (max 36 characters).
 * Suffix '_enter_node' is 11 chars, leaving max 25 chars for the flow prefix.
 * If the full name exceeds 36 chars, breaks on non-word / boundary characters (_ or -)
 * to keep the name meaningful, falling back to a hard break if no boundary exists.
 */
export function getEnterNodeToolName(flowId: string): string {
  const suffix = '_enter_node';
  const maxTotalLen = 36;
  const maxPrefixLen = maxTotalLen - suffix.length; // 25

  let cleaned = flowId.toLowerCase().replace(/[-]/g, '_').replace(/[^a-z0-9_]/g, '_').replace(/^[^a-z0-9]+/, '');
  if (!cleaned) {
    cleaned = 'flow';
  }

  // If already fits with suffix, return it
  if (cleaned.length + suffix.length <= maxTotalLen) {
    return `${cleaned}${suffix}`;
  }

  // Prefix exceeds maxPrefixLen (25 chars).
  const candidate = cleaned.substring(0, maxPrefixLen);
  const lastBoundary = candidate.lastIndexOf('_');

  let trimmedPrefix = '';
  if (lastBoundary > 0) {
    trimmedPrefix = candidate.substring(0, lastBoundary).replace(/_+$/, '');
  }

  // Fallback to hard break if no boundary found or trimmed prefix is empty
  if (!trimmedPrefix) {
    trimmedPrefix = candidate.replace(/_+$/, '');
  }

  if (!trimmedPrefix) {
    trimmedPrefix = 'flow';
  }

  return `${trimmedPrefix}${suffix}`;
}
