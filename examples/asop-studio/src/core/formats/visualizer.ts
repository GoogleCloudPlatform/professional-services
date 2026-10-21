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
import { execSync } from 'child_process';
import YAML from 'yaml';
import type { FormatModule, ImportOptions, ImportResult, ExportOptions, ExportResult } from './types';
import { buildUnifiedSop, getAssetsPath } from './utils';

export const visualizerFormat: FormatModule = {
  id: 'visualizer',

  async import({ buffer, targetDir, sanitizedName }: ImportOptions): Promise<ImportResult> {
    const htmlContent = buffer.toString('utf-8');
    
    // Locate and extract the unified SOP YAML.
    const matches = Array.from(htmlContent.matchAll(/<script id="sop-data" type="application\/yaml"([^>]*)>\s*([\s\S]*?)\s*<\/script>/g));
    if (matches.length === 0) {
      throw new Error('Invalid Visualizer HTML: Could not find embedded SOP data (missing <script id="sop-data">).');
    }
    const lastMatch = matches[matches.length - 1];
    const attrs = lastMatch[1];
    let yamlContent = lastMatch[2].trim();

    if (attrs.includes('data-encoding="base64"')) {
      yamlContent = Buffer.from(yamlContent, 'base64').toString('utf-8');
    }
    
    // Delegate to the yaml format handler to perform parsing/splitting
    const { yamlFormat } = await import('./yaml');
    if (!yamlFormat.import) {
      throw new Error('YAML format handler does not support import.');
    }
    
    return yamlFormat.import({
      buffer: Buffer.from(yamlContent, 'utf-8'),
      targetDir,
      sanitizedName
    });
  },

  async export({ projectName, folderPath }: ExportOptions): Promise<ExportResult> {
    // 1. Build the production build of the ASOP Studio client (only in development environment)
    const isDevRepo = fs.existsSync(path.join(process.cwd(), 'vite.config.ts')) && fs.existsSync(path.join(process.cwd(), 'package.json'));
    if (isDevRepo && !process.env.SKIP_BUILD && process.env.NODE_ENV !== 'production') {
      try {
        execSync('npm run build', { cwd: process.cwd(), stdio: 'pipe' });
      } catch (err: any) {
        const output = err.stdout?.toString() || err.stderr?.toString() || err.message;
        console.error('Failed to run npm run build during visualizer export:', output);
        const distDir = getAssetsPath('dist');
        if (!fs.existsSync(path.join(distDir, 'index.html'))) {
          throw new Error(`Failed to build client for visualizer export: ${output}`);
        }
      }
    }

    // 2. Build the unified SOP YAML
    const unifiedSop = buildUnifiedSop(projectName, folderPath);
    const yamlString = YAML.stringify(unifiedSop);

    // 3. Read dist/index.html and assets
    const distDir = getAssetsPath('dist');
    if (!fs.existsSync(path.join(distDir, 'index.html'))) {
      throw new Error(`Visualizer template index.html not found in ${distDir}. Run 'npm run build' first.`);
    }
    let html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

    // 4. Embed the SOP YAML data block (base64 encoded to protect against HTML tag matching issues)
    const base64Yaml = Buffer.from(yamlString, 'utf-8').toString('base64');
    const embeddedScript = `
<script id="sop-data" type="application/yaml" data-encoding="base64">
${base64Yaml}
</script>
`;
    // Replace '</body>' before inlining JS/CSS, so that we match the clean HTML template's actual body tag instead of any strings in the JS bundle.
    html = html.replace('</body>', `${embeddedScript}</body>`);

    // Inject the visualizer marker/flag and active SOP name in window context
    const windowFlag = `<script>window.IS_EMBEDDED_VISUALIZER = true; window.EMBEDDED_SOP_NAME = ${JSON.stringify(projectName)};</script>`;
    html = html.replace('<head>', `<head>${windowFlag}`);

    // Update HTML page title to avoid confusion with the main studio editor
    html = html.replace(/<title>[^<]+<\/title>/g, '<title>ASOP Studio Visualizer</title>');

    // 5. Inline CSS
    const cssRegex = /<link\s+[^>]*href="\/assets\/([^"]+\.css)"[^>]*\/?>/g;
    html = html.replace(cssRegex, (match, cssFile) => {
      const cssPath = path.join(distDir, 'assets', cssFile);
      if (fs.existsSync(cssPath)) {
        const cssContent = fs.readFileSync(cssPath, 'utf-8');
        return `<style>${cssContent}</style>`;
      }
      return match;
    });

    // 6. Inline JS
    const jsRegex = /<script\s+[^>]*src="\/assets\/([^"]+\.js)"[^>]*><\/script>/g;
    html = html.replace(jsRegex, (match, jsFile) => {
      const jsPath = path.join(distDir, 'assets', jsFile);
      if (fs.existsSync(jsPath)) {
        let jsContent = fs.readFileSync(jsPath, 'utf-8');
        // Escape </script> inside inlined JS to prevent browser parsing errors
        jsContent = jsContent.replace(/<\/script>/gi, '<\\/script>');
        return `<script type="module">${jsContent}</script>`;
      }
      return match;
    });

    // Convert and inline favicon.svg as a data URI for clean self-containment
    const faviconPath = path.join(distDir, 'favicon.svg');
    if (fs.existsSync(faviconPath)) {
      const faviconContent = fs.readFileSync(faviconPath);
      const base64Favicon = faviconContent.toString('base64');
      const faviconRegex = /<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="\/favicon.svg"\s*\/?>/g;
      html = html.replace(faviconRegex, `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${base64Favicon}" />`);
    }

    const htmlBuffer = Buffer.from(html, 'utf-8');

    return {
      data: htmlBuffer,
      contentType: 'text/html',
      filename: `${projectName}_visualizer.html`
    };
  }
};
