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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { toolsSignaturesFormat, collectToolsFromSopFiles, generateToolsReportPdf } from '../src/core/formats/report/tools_signatures';
import { readProjectFilesFromDisk } from '../src/core/formats/utils';

describe('Reports Export Functionality (Tools and Signatures PDF)', () => {
  const sampleSopDir = path.resolve(process.cwd(), 'example_sops/pizza-order-flow');
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asop-test-report-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should correctly collect tools, parameters, return types, and node usages from SOP files', () => {
    const files = readProjectFilesFromDisk(sampleSopDir);
    const tools = collectToolsFromSopFiles(files);

    expect(tools.length).toBeGreaterThan(0);

    const calcTool = tools.find(t => t.name === 'calculate_total_price');
    expect(calcTool).toBeDefined();
    expect(calcTool?.name).toBe('calculate_total_price');
    expect(calcTool?.params.map(p => p.name)).toContain('pizza');
    expect(calcTool?.params.map(p => p.name)).toContain('size');
    expect(calcTool?.returnType).toContain('price_details');
    expect(calcTool?.usages.some(u => u.nodeId === 'calculate-order-price')).toBe(true);

    const placeTool = tools.find(t => t.name === 'place_pizza_order');
    expect(placeTool).toBeDefined();
    expect(placeTool?.usages.some(u => u.nodeId === 'submit-pizza-order')).toBe(true);
  });

  it('should generate a valid PDF buffer with %PDF header for tools and signatures report', () => {
    const files = readProjectFilesFromDisk(sampleSopDir);
    const tools = collectToolsFromSopFiles(files);
    const pdfUint8 = generateToolsReportPdf('pizza-order-flow', tools);
    const pdfBuffer = Buffer.from(pdfUint8);

    expect(pdfBuffer.length).toBeGreaterThan(100);
    expect(pdfBuffer.toString('utf-8', 0, 5)).toBe('%PDF-');
  });

  it('should export tools-signatures report via FormatModule interface', async () => {
    const result = await toolsSignaturesFormat.export({
      projectName: 'pizza-order-flow',
      folderPath: sampleSopDir
    });

    expect(result.contentType).toBe('application/pdf');
    expect(result.filename).toBe('pizza-order-flow_tools_signatures_report.pdf');
    expect(Buffer.isBuffer(result.data)).toBe(true);
    expect(result.data.toString('utf-8', 0, 5)).toBe('%PDF-');

    const targetFile = path.join(tempDir, result.filename);
    fs.writeFileSync(targetFile, result.data);
    expect(fs.existsSync(targetFile)).toBe(true);
    expect(fs.statSync(targetFile).size).toBeGreaterThan(500);
  });

  it('should generate a clean PDF report even when no tools exist in the SOP', async () => {
    const noToolsFiles: Record<string, string> = {
      'main.yml': `
flow:
  id: no-tools-flow
  version: 2
  root_node_id: start-node
  nodes:
    - id: start-node
      agent_instructions: "Hello world"
`
    };

    const tools = collectToolsFromSopFiles(noToolsFiles);
    expect(tools.length).toBe(0);

    const pdfUint8 = generateToolsReportPdf('no-tools-flow', tools);
    const pdfBuffer = Buffer.from(pdfUint8);
    expect(pdfBuffer.toString('utf-8', 0, 5)).toBe('%PDF-');
  });
});
