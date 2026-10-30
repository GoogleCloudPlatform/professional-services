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
import type { FormatModule, ImportOptions, ImportResult, ExportOptions, ExportResult } from './types';
import { buildUnifiedSop } from './utils';
import { parseYamlToSopProject } from '../../common/sopCommon';

export const yamlFormat: FormatModule = {
  id: 'yaml',

  async import({ buffer, targetDir, sanitizedName }: ImportOptions): Promise<ImportResult> {
    const content = buffer.toString('utf-8');
    
    // Parse and split logic is entirely delegated to shared client/server module
    const project = parseYamlToSopProject(content, sanitizedName);

    // Save individual flow files to targetDir
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    for (const [filename, fileContent] of Object.entries(project.files)) {
      fs.writeFileSync(path.join(targetDir, filename), fileContent, 'utf-8');
    }

    return { success: true, name: sanitizedName };
  },

  async export({ projectName, folderPath }: ExportOptions): Promise<ExportResult> {
    const unified = buildUnifiedSop(projectName, folderPath);
    const yamlString = YAML.stringify(unified);
    const yamlBuffer = Buffer.from(yamlString, 'utf-8');

    return {
      data: yamlBuffer,
      contentType: 'text/yaml',
      filename: `${projectName}.yaml`
    };
  }
};
