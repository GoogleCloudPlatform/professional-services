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

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { visualizerFormat } from '../src/core/formats/visualizer';

test.describe('Visualizer Offline Page rendering', () => {
  let tempFile: string;

  test.afterEach(({}, testInfo) => {
    if (testInfo.status === 'passed' && tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  });

  test('should open visualizer HTML and load/render the graph without console errors', async ({ page }) => {
    test.setTimeout(60000);
    const fixtureV2SopDir = path.resolve(process.cwd(), 'tests/fixtures/sop_export/sample_v2_sop');
    const exportResult = await visualizerFormat.export({
      projectName: 'sample-v2-sop',
      folderPath: fixtureV2SopDir
    });

    // Write the output to a temp file in the workspace to bypass OS temp directory sandbox restrictions
    tempFile = path.join(process.cwd(), `tests/temp-visualizer-${Date.now()}.html`);
    fs.writeFileSync(tempFile, exportResult.data);

    // Track console messages and errors
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    // Open the local file via file:// protocol
    const fileUrl = `file://${tempFile}`;
    await page.goto(fileUrl, { waitUntil: 'commit' });

    // Wait for the page to initialize (React Flow canvas elements)
    await page.waitForSelector('.react-flow__node', { state: 'attached', timeout: 30000 });

    // Assert that the page renders nodes
    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(0);

    // Verify the inspector updates when a node is clicked
    const startNode = page.locator('.react-flow__node', { hasText: 'start-node' });
    await startNode.click();

    // Check that the inspector panel shows details about the node
    await expect(page.locator('.inspector-sidebar')).toBeVisible();

    // Check that we don't have any uncaught syntax/module errors in consoleErrors
    const criticalErrors = consoleErrors.filter(err => 
      err.includes('SyntaxError') || 
      err.includes('Unexpected') || 
      err.includes('Failed to load') || 
      err.includes('Unsafe attempt')
    );
    expect(criticalErrors).toEqual([]);
  });
});
