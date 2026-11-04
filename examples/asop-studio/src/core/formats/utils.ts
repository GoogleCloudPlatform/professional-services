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

export function getAssetsPath(relativeAssetPath: string): string {
  if (typeof process === 'undefined' || typeof process.cwd !== 'function') {
    return relativeAssetPath;
  }
  let currentDir = process.cwd();
  if (fs && fs.existsSync) {
    for (let i = 0; i < 4; i++) {
      const candidate = path.join(currentDir, relativeAssetPath);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }
  }
  return path.resolve(process.cwd(), relativeAssetPath);
}

import {
  formatProjectName as commonFormatProjectName,
  rewriteRoutesToFiles as commonRewriteRoutesToFiles,
  rewriteRoutesToFlowIds as commonRewriteRoutesToFlowIds,
  validateSopProject,
  buildUnifiedSop as commonBuildUnifiedSop
} from '../../common/sopCommon';

export {
  commonFormatProjectName as formatProjectName,
  commonRewriteRoutesToFiles as rewriteRoutesToFiles,
  commonRewriteRoutesToFlowIds as rewriteRoutesToFlowIds
};

/**
 * Reads all yaml/yml files from a folder and maps them filename -> content
 */
export function readProjectFilesFromDisk(folderPath: string): Record<string, string> {
  const files: Record<string, string> = {};
  if (typeof fs !== 'undefined' && fs.existsSync && fs.existsSync(folderPath)) {
    const dirFiles = fs.readdirSync(folderPath);
    dirFiles.forEach(file => {
      if (file.endsWith('.yml') || file.endsWith('.yaml')) {
        files[file] = fs.readFileSync(path.join(folderPath, file), 'utf-8');
      }
    });
  }
  return files;
}

/**
 * Validates that all flow files in the target directory are specified with the same spec version.
 * Throws an error if there's a mismatch or missing version field.
 */
export function validateImportedSop(targetDir: string): void {
  const files = readProjectFilesFromDisk(targetDir);
  // Default mainFile for validation purposes
  const mainFile = Object.keys(files).find(f => f === 'main.yml' || f.endsWith('-main.yml')) || Object.keys(files)[0] || 'main.yml';
  validateSopProject({ mainFile, files });
}

/**
 * Builds the unified SOP spec from individual files on disk.
 */
export function buildUnifiedSop(projectName: string, folderPath: string) {
  const files = readProjectFilesFromDisk(folderPath);
  return commonBuildUnifiedSop(projectName, files);
}

/**
 * Strips redundant runtime fields from an individual flow object (e.g. global_instructions,
 * prompt_guard, example_journeys, review_requests, and mock_responses on actions).
 */
function stripFlowData(flow: any): void {
  if (!flow || typeof flow !== 'object') return;
  delete flow.global_instructions;
  delete flow.prompt_guard;
  delete flow.example_journeys;
  delete flow.review_requests;

  if (flow.nodes && Array.isArray(flow.nodes)) {
    flow.nodes.forEach((node: any) => {
      if (!node || typeof node !== 'object') return;
      delete node.review_requests;
      if (node.actions && Array.isArray(node.actions)) {
        node.actions.forEach((action: any) => {
          if (!action || typeof action !== 'object') return;
          delete action.mock_responses;
          delete action.review_requests;
        });
      }
      if (node.condition_routes && Array.isArray(node.condition_routes)) {
        node.condition_routes.forEach((route: any) => {
          if (!route || typeof route !== 'object') return;
          delete route.review_requests;
        });
      }
      if (node.intent_routes && Array.isArray(node.intent_routes)) {
        node.intent_routes.forEach((route: any) => {
          if (!route || typeof route !== 'object') return;
          delete route.review_requests;
        });
      }
    });
  }

  if (flow.global_intent_routes && Array.isArray(flow.global_intent_routes)) {
    flow.global_intent_routes.forEach((route: any) => {
      if (!route || typeof route !== 'object') return;
      delete route.review_requests;
    });
  }
}

/**
 * Returns a clone of the unified SOP or flow object optimized for agent runtime by stripping redundant data
 * like mock_responses, example_journeys, global_instructions, prompt_guard, and review_requests.
 */
export function optimizeSopForRuntime(sopSpec: any): any {
  if (!sopSpec || typeof sopSpec !== 'object') {
    return sopSpec;
  }
  const cloned = JSON.parse(JSON.stringify(sopSpec));

  // Strip example journeys, global instructions, prompt guard, and review requests from root and sop levels
  delete cloned.example_journeys;
  delete cloned.global_instructions;
  delete cloned.prompt_guard;
  delete cloned.review_requests;

  if (cloned.sop && typeof cloned.sop === 'object') {
    delete cloned.sop.example_journeys;
    delete cloned.sop.global_instructions;
    delete cloned.sop.prompt_guard;
    delete cloned.sop.review_requests;
  }

  const flows = cloned.sop?.flows || cloned.flows;
  if (flows && typeof flows === 'object') {
    for (const flow of Object.values(flows) as any[]) {
      stripFlowData(flow);
    }
  } else if (cloned.flow && typeof cloned.flow === 'object') {
    stripFlowData(cloned.flow);
  } else if (cloned.nodes || cloned.root_node_id || cloned.global_intent_routes) {
    stripFlowData(cloned);
  }

  return cloned;
}

/**
 * Retrieves the current version of the ASOP Studio from the root package.json file.
 */
export function getStudioVersion(): string {
  if (typeof process === 'undefined' || typeof process.cwd !== 'function') {
    return 'UNKNOWN VERSION';
  }
  try {
    const packageJsonPath = getAssetsPath('package.json');
    if (fs && fs.existsSync && fs.existsSync(packageJsonPath)) {
      const content = fs.readFileSync(packageJsonPath, 'utf8');
      const pkg = JSON.parse(content);
      if (pkg && pkg.version) {
        return pkg.version;
      }
    }
  } catch {
    // ignore
  }
  return '0.1.0';
}

