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
import { mapSopTypeToCxas } from './utils';
import type { ParsedSopFlow, SopIntentRoute } from './types';

export function extractVariables(folderPath: string, files: string[]): Map<string, string> {
  const variablesMap = new Map<string, string>();

  files.forEach(file => {
    if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      try {
        const fileContent = fs.readFileSync(path.join(folderPath, file), 'utf-8');
        const parsed = YAML.parse(fileContent) as ParsedSopFlow | undefined;
        const flow = parsed?.flow;
        if (!flow) return;

        const extractFromRoutes = (routes: SopIntentRoute[] | undefined) => {
          if (!Array.isArray(routes)) return;
          routes.forEach(route => {
            if (route && Array.isArray(route.set_variables)) {
              route.set_variables.forEach((v) => {
                const isString = typeof v === 'string';
                const name = isString ? v : v?.name;
                const type = isString ? 'string' : v?.type || 'string';
                if (name) {
                  const cxasType = mapSopTypeToCxas(type);
                  variablesMap.set(name, cxasType);
                }
              });
            }
          });
        };

        if (flow.global_intent_routes) {
          extractFromRoutes(flow.global_intent_routes);
        }
        if (flow.nodes && Array.isArray(flow.nodes)) {
          flow.nodes.forEach((node) => {
            if (node.intent_routes) {
              extractFromRoutes(node.intent_routes);
            }
            if (node.actions && Array.isArray(node.actions)) {
              node.actions.forEach((act) => {
                if (act && act.store_result_variable) {
                  variablesMap.set(act.store_result_variable, 'STRING');
                }
              });
            }
          });
        }
        if (flow.input_variables && Array.isArray(flow.input_variables)) {
          flow.input_variables.forEach((v: any) => {
            const isString = typeof v === 'string';
            const name = isString ? v : v?.name;
            const type = isString ? 'string' : v?.type || 'string';
            if (name) {
              const cxasType = mapSopTypeToCxas(type);
              variablesMap.set(name, cxasType);
            }
          });
        }
      } catch {
        // Ignore
      }
    }
  });

  return variablesMap;
}
