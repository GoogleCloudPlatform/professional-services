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

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import type { ParsedSopFlow } from './types';

export interface SopToolParam {
  name: string;
  type: string; // CXAS type ('STRING', 'NUMBER', 'BOOLEAN')
}

export interface SopToolInfo {
  name: string;
  params: Map<string, SopToolParam>; // paramName -> SopToolParam
}

function getParameterType(value: any, variablesMap: Map<string, string>): string {
  if (typeof value === 'boolean') {
    return 'BOOLEAN';
  }
  if (typeof value === 'number') {
    return 'NUMBER';
  }
  if (typeof value === 'string') {
    if (variablesMap.has(value)) {
      return variablesMap.get(value)!;
    }
    return 'STRING'; // default to string literal
  }
  return 'STRING'; // fallback
}

export function collectSopTools(
  folderPath: string,
  files: string[],
  variablesMap: Map<string, string>
): Map<string, SopToolInfo> {
  const toolsMap = new Map<string, SopToolInfo>();
  files.forEach(file => {
    if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      try {
        const content = fs.readFileSync(path.join(folderPath, file), 'utf-8');
        const parsed = YAML.parse(content) as ParsedSopFlow | undefined;
        const flow = parsed?.flow;
        if (!flow) return;
        
        const nodes = flow.nodes || [];
        nodes.forEach((node: any) => {
          if (node.actions && Array.isArray(node.actions)) {
            node.actions.forEach((act: any) => {
              if (act.type === 'tool' && act.tool_name) {
                const toolName = act.tool_name;
                if (!toolsMap.has(toolName)) {
                  toolsMap.set(toolName, { name: toolName, params: new Map() });
                }
                const tInfo = toolsMap.get(toolName)!;
                if (act.tool_params && typeof act.tool_params === 'object') {
                  Object.entries(act.tool_params).forEach(([paramName, val]) => {
                    const paramType = getParameterType(val, variablesMap);
                    tInfo.params.set(paramName, { name: paramName, type: paramType });
                  });
                }
              }
            });
          }
        });
      } catch (e) {
        // ignore
      }
    }
  });
  return toolsMap;
}
