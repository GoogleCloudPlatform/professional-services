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

import type { CxasExportContext } from './types';

interface CoordinatorTemplates {
  appJson: unknown;
  environmentJsonTemplate: unknown;
  globalInstructions?: string;
}

export function writeCoordinatorAndConfigs(
  context: CxasExportContext,
  agentDirName: string,
  templates: CoordinatorTemplates
): void {
  const { zip } = context;
  const { appJson, environmentJsonTemplate } = templates;

  // Write App & Environment configs
  zip.addFile(`${agentDirName}/app.json`, Buffer.from(JSON.stringify(appJson, null, 2), 'utf-8'));
  zip.addFile(`${agentDirName}/environment.json`, Buffer.from(JSON.stringify(environmentJsonTemplate, null, 2), 'utf-8'));

  if (templates.globalInstructions) {
    zip.addFile(`${agentDirName}/global_instruction.txt`, Buffer.from(templates.globalInstructions, 'utf-8'));
  }
}
