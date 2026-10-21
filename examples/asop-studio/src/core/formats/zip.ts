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
import AdmZip from 'adm-zip';
import type { FormatModule, ImportOptions, ImportResult, ExportOptions, ExportResult } from './types';
import { validateImportedSop } from './utils';

export const zipFormat: FormatModule = {
  id: 'zip',

  async import({ buffer, targetDir, sanitizedName }: ImportOptions): Promise<ImportResult> {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    
    // Detect single top-level directory wrapper in zip
    const topLevelDirs = new Set<string>();
    entries.forEach(entry => {
      if (entry.entryName.includes('/')) {
        topLevelDirs.add(entry.entryName.split('/')[0]);
      } else if (!entry.isDirectory) {
        topLevelDirs.add('');
      }
    });

    // Extract everything
    zip.extractAllTo(targetDir, true);

    // Clean up extracted _snapshots folder if any, as it is ignored during upload
    const snapshotsPath = path.join(targetDir, '_snapshots');
    if (fs.existsSync(snapshotsPath)) {
      fs.rmSync(snapshotsPath, { recursive: true, force: true });
    }

    // Move files out of wrapper if applicable
    if (topLevelDirs.size === 1 && !topLevelDirs.has('')) {
      const wrapperName = Array.from(topLevelDirs)[0];
      const wrapperPath = path.join(targetDir, wrapperName);
      if (fs.existsSync(wrapperPath) && fs.statSync(wrapperPath).isDirectory()) {
        const files = fs.readdirSync(wrapperPath);
        files.forEach(file => {
          fs.renameSync(path.join(wrapperPath, file), path.join(targetDir, file));
        });
        fs.rmdirSync(wrapperPath);
      }
    }

    // Validate version consistency across all imported flows in targetDir
    try {
      validateImportedSop(targetDir);
    } catch (err) {
      // Clean up the imported directory on failure
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
      throw err;
    }

    return { success: true, name: sanitizedName };
  },

  async export({ projectName, folderPath }: ExportOptions): Promise<ExportResult> {
    const zip = new AdmZip();
    zip.addLocalFolder(folderPath);
    const zipBuffer = zip.toBuffer();

    return {
      data: zipBuffer,
      contentType: 'application/zip',
      filename: `${projectName}.zip`
    };
  }
};
