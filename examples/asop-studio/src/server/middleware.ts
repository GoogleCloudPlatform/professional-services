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

import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { getFormat } from '../core/formats/registry';
import { validateImportedSop } from '../core/formats/utils';

const sopDir = path.resolve(process.cwd(), 'data/sop');
const exampleSopDir = path.resolve(process.cwd(), 'example_sops/pizza-order-flow');

function seedExampleSop(): boolean {
  if (!fs.existsSync(exampleSopDir)) {
    return false;
  }
  const targetDir = path.join(sopDir, 'pizza-order-flow');
  fs.mkdirSync(targetDir, { recursive: true });
  const files = fs.readdirSync(exampleSopDir);
  for (const file of files) {
    if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      fs.copyFileSync(path.join(exampleSopDir, file), path.join(targetDir, file));
    }
  }
  return true;
}

if (!fs.existsSync(sopDir)) {
  fs.mkdirSync(sopDir, { recursive: true });
  seedExampleSop();
}

export async function apiMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  // 0. GET /api/user (fetch authenticated user email from IAP headers if available)
  if (pathname === '/api/user' && req.method === 'GET') {
    try {
      const emailHeader = req.headers['x-goog-authenticated-user-email'];
      let email = '';
      if (typeof emailHeader === 'string' && emailHeader) {
        email = emailHeader.replace(/^accounts\.google\.com:/, '');
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ email }));
    } catch (err: unknown) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    }
    return;
  }

  // 1. GET /api/sops
  if (pathname === '/api/sops' && req.method === 'GET') {
    try {
      const projects: Record<string, { mainFile: string; files: Record<string, string> }> = {};
      const items = fs.readdirSync(sopDir);

      for (const item of items) {
        const itemPath = path.join(sopDir, item);
        if (fs.statSync(itemPath).isDirectory()) {
          const files = fs.readdirSync(itemPath);
          const yamlFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
          
          if (yamlFiles.length > 0) {
            const filesMap: Record<string, string> = {};
            yamlFiles.forEach(file => {
              filesMap[file] = fs.readFileSync(path.join(itemPath, file), 'utf-8');
            });

            // Read snapshots recursively
            const snapshotsDir = path.join(itemPath, '_snapshots');
            if (fs.existsSync(snapshotsDir) && fs.statSync(snapshotsDir).isDirectory()) {
              const readSnapshotsRecursively = (dir: string, relativePrefix: string) => {
                const entries = fs.readdirSync(dir);
                for (const entry of entries) {
                  const entryPath = path.join(dir, entry);
                  const relPath = path.join(relativePrefix, entry);
                  if (fs.statSync(entryPath).isDirectory()) {
                    readSnapshotsRecursively(entryPath, relPath);
                  } else if (entry.endsWith('.yml') || entry.endsWith('.yaml')) {
                    filesMap[relPath] = fs.readFileSync(entryPath, 'utf-8');
                  }
                }
              };
              readSnapshotsRecursively(snapshotsDir, '_snapshots');
            }

            const mainFile = filesMap['main.yaml'] ? 'main.yaml' : filesMap['main.yml'] ? 'main.yml' : yamlFiles[0];
            projects[item] = {
              mainFile,
              files: filesMap
            };
          }
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(projects));
    } catch (err: unknown) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    }
    return;
  }

  // 2. POST /api/sops/import
  if (pathname === '/api/sops/import' && req.method === 'POST') {
    try {
      const name = urlObj.searchParams.get('name');
      const format = urlObj.searchParams.get('format');

      if (!name) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing name parameter' }));
        return;
      }

      const sanitizedName = name.toLowerCase().replace(/[^a-zA-Z0-9-]/g, '-');
      const targetDir = path.join(sopDir, sanitizedName);

      // Wipe transient sopDir on import to start fresh with the new project
      if (fs.existsSync(sopDir)) {
        fs.rmSync(sopDir, { recursive: true, force: true });
      }
      fs.mkdirSync(sopDir, { recursive: true });
      fs.mkdirSync(targetDir, { recursive: true });

      // Read the body
      const chunks: Buffer[] = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const contentType = req.headers['content-type'] || '';

          if (contentType.includes('application/json') || format === 'folder') {
            const body = JSON.parse(buffer.toString('utf-8'));
            const filesMap: Record<string, string> = body.files || {};

            for (const [filename, fileContent] of Object.entries(filesMap)) {
              if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
                if (filename.startsWith('_snapshots/')) {
                  const subPath = path.join(targetDir, filename);
                  const subDir = path.dirname(subPath);
                  if (!fs.existsSync(subDir)) {
                    fs.mkdirSync(subDir, { recursive: true });
                  }
                  fs.writeFileSync(subPath, fileContent, 'utf-8');
                } else {
                  const baseName = path.basename(filename);
                  fs.writeFileSync(path.join(targetDir, baseName), fileContent, 'utf-8');
                }
              }
            }

            // Validate version consistency
            validateImportedSop(targetDir);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, name: sanitizedName }));
          } else {
            const formatModule = format ? getFormat(format) : undefined;
            if (!formatModule || !formatModule.import) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Unsupported or non-importable format: ${format}` }));
              return;
            }

            const result = await formatModule.import!({
              buffer,
              targetDir,
              sanitizedName
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          }
        } catch (innerErr: unknown) {
          // Clean up directory on failure
          if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
          }
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: innerErr instanceof Error ? innerErr.message : String(innerErr) }));
        }
      });
    } catch (err: unknown) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    }
    return;
  }

  // 4. POST /api/sops/clear
  if (pathname === '/api/sops/clear' && req.method === 'POST') {
    try {
      if (fs.existsSync(sopDir)) {
        fs.rmSync(sopDir, { recursive: true, force: true });
      }
      fs.mkdirSync(sopDir, { recursive: true });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err: unknown) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    }
    return;
  }

  // 5. POST /api/sops/load-example
  if (pathname === '/api/sops/load-example' && req.method === 'POST') {
    try {
      if (fs.existsSync(sopDir)) {
        fs.rmSync(sopDir, { recursive: true, force: true });
      }
      fs.mkdirSync(sopDir, { recursive: true });
      if (!seedExampleSop()) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bundled example SOP (pizza-order-flow) not found on server.' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, name: 'pizza-order-flow' }));
    } catch (err: unknown) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    }
    return;
  }

  // 3. GET /api/sops/:name/export
  const exportMatch = pathname.match(/^\/api\/sops\/([^/]+)\/export$/);
  if (exportMatch && req.method === 'GET') {
    try {
      const name = exportMatch[1];
      const format = urlObj.searchParams.get('format') || 'zip';
      const folderPath = path.join(sopDir, name);

      if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `SOP project ${name} not found.` }));
        return;
      }

      const formatModule = getFormat(format);
      if (!formatModule || !formatModule.export) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Unsupported or non-exportable format: ${format}` }));
        return;
      }

      const result = await formatModule.export({
        projectName: name,
        folderPath,
        mode: urlObj.searchParams.get('mode') || undefined
      });

      const headers: Record<string, string | number> = {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': result.data.length
      };

      if (result.warnings && result.warnings.length > 0) {
        headers['X-Export-Warnings'] = JSON.stringify(result.warnings);
        headers['Access-Control-Expose-Headers'] = 'Content-Disposition, X-Export-Warnings';
      }

      res.writeHead(200, headers);
      res.end(result.data);
    } catch (err: unknown) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    }
    return;
  }

  // Pass through to next middleware if not matching our API prefix
  next();
}
