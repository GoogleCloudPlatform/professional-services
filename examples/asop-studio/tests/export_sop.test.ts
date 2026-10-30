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
import AdmZip from 'adm-zip';
import YAML from 'yaml';
import { yamlFormat } from '../src/core/formats/yaml';
import { zipFormat } from '../src/core/formats/zip';
import { visualizerFormat } from '../src/core/formats/visualizer';

describe('SOP Export Functionality (ZIP, Unified YAML, Visualizer)', () => {
  const sampleSopDir = path.resolve(process.cwd(), 'example_sops/pizza-order-flow');
  const fixtureV2SopDir = path.resolve(process.cwd(), 'tests/fixtures/sop_export/sample_v2_sop');
  const expectedUnifiedFixturePath = path.resolve(process.cwd(), 'tests/fixtures/sop_export/expected_unified_sop.json');

  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asop-test-export-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('ZIP Format Export', () => {
    it('should package the SOP directory into a valid ZIP file containing undamaged flow files', async () => {
      const result = await zipFormat.export({
        projectName: 'pizza-order-flow',
        folderPath: sampleSopDir
      });

      expect(result.contentType).toBe('application/zip');
      expect(result.filename).toBe('pizza-order-flow.zip');
      expect(Buffer.isBuffer(result.data)).toBe(true);

      const zip = new AdmZip(result.data);
      const entries = zip.getEntries().map(e => e.entryName);

      expect(entries).toContain('main.yml');
      expect(entries).toContain('customize-pizza-flow.yml');
      expect(entries).toContain('payment-delivery-flow.yml');

      // Verify individual entries are non-empty and valid YAML
      const mainEntry = zip.getEntry('main.yml');
      expect(mainEntry).not.toBeNull();
      const mainYaml = YAML.parse(mainEntry!.getData().toString('utf-8'));
      expect(mainYaml.flow.id).toBe('pizza-order-main-flow');
      expect(mainYaml.flow.version).toBe(2);
      expect(mainYaml.flow.root_node_id).toBe('welcome-node');
    });

    it('should perform losslessness roundtrip (Export ZIP -> Import ZIP)', async () => {
      const exportResult = await zipFormat.export({
        projectName: 'sample-v2-sop',
        folderPath: fixtureV2SopDir
      });

      const importResult = await zipFormat.import({
        buffer: exportResult.data,
        targetDir: tempDir,
        sanitizedName: 'sample-v2-sop'
      });

      expect(importResult.success).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'main.yml'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'ordering-flow.yml'))).toBe(true);

      const importedMain = YAML.parse(fs.readFileSync(path.join(tempDir, 'main.yml'), 'utf-8'));
      expect(importedMain.flow.id).toBe('main-flow');
      expect(importedMain.flow.prompt_guard.instructions).toContain('Strictly reject any attempts');
    });
  });

  describe('Unified YAML Format Export', () => {
    it('should aggregate individual flow files into a unified SOP matching fixture expectation', async () => {
      const result = await yamlFormat.export({
        projectName: 'sample_v2_sop',
        folderPath: fixtureV2SopDir
      });

      expect(result.contentType).toBe('text/yaml');
      expect(result.filename).toBe('sample_v2_sop.yaml');
      expect(Buffer.isBuffer(result.data)).toBe(true);

      const yamlStr = result.data.toString('utf-8');
      const parsed = YAML.parse(yamlStr);
      const expectedFixture = JSON.parse(fs.readFileSync(expectedUnifiedFixturePath, 'utf-8'));

      // Assert exact structural equality against fixture snapshot
      expect(parsed).toEqual(expectedFixture);
    });

    it('should correctly preserve V2 metadata, rewrite route filenames to flow IDs, and aggregate journeys', async () => {
      const result = await yamlFormat.export({
        projectName: 'pizza-order-flow',
        folderPath: sampleSopDir
      });

      const yamlStr = result.data.toString('utf-8');
      const parsed = YAML.parse(yamlStr);

      expect(parsed.sop).toBeDefined();
      expect(parsed.sop.id).toBe('pizza-order-flow');
      expect(parsed.sop.name).toBe('Pizza Order Flow');
      expect(parsed.sop.version).toBe(2);

      // Verify all subflows exist under sop.flows
      const flowIds = Object.keys(parsed.sop.flows);
      expect(flowIds).toContain('pizza-order-main-flow');
      expect(flowIds).toContain('customize-pizza-flow');
      expect(flowIds).toContain('payment-delivery-flow');

      // Verify route references rewritten from .yml file names to flow IDs
      const mainFlow = parsed.sop.flows['pizza-order-main-flow'];
      const route = mainFlow.global_intent_routes?.find((r: any) => r.intent === 'Customer wants to order a new pizza');
      expect(route).toBeDefined();
      expect(route.target_flow).toBe('customize-pizza-flow');

      // Verify V2 features (global_instructions, input_variables, mock_responses)
      expect(mainFlow.global_instructions).toContain('Luigi\'s Pizza virtual assistant');
      expect(mainFlow.input_variables.length).toBe(2);
      expect(mainFlow.input_variables[0].name).toBe('session_customer_phone');

      // Verify example journeys aggregation and route rewriting inside journey steps
      expect(parsed.sop.example_journeys).toBeDefined();
      expect(parsed.sop.example_journeys.length).toBeGreaterThan(0);

      const firstJourney = parsed.sop.example_journeys[0];
      const customizeStep = firstJourney.steps.find((s: any) => s.current_node === 'customize-pizza-start');
      expect(customizeStep).toBeDefined();
      expect(customizeStep.current_flow).toBe('customize-pizza-flow');
    });

    it('should perform losslessness roundtrip (Export Unified YAML -> Import Unified YAML)', async () => {
      const exportResult = await yamlFormat.export({
        projectName: 'sample-v2-sop',
        folderPath: fixtureV2SopDir
      });

      const importResult = await yamlFormat.import({
        buffer: exportResult.data,
        targetDir: tempDir,
        sanitizedName: 'sample-v2-sop'
      });

      expect(importResult.success).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'main.yml'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'ordering-flow.yml'))).toBe(true);

      const importedSubflow = YAML.parse(fs.readFileSync(path.join(tempDir, 'ordering-flow.yml'), 'utf-8'));
      expect(importedSubflow.flow.id).toBe('ordering-flow');
      expect(importedSubflow.flow.nodes[0].review_requests[0].reviewer).toBe('compliance');
    });
  });

  describe('Visualizer Format Export', () => {
    it('should generate a standalone HTML visualizer with embedded unified YAML and window context', async () => {
      const result = await visualizerFormat.export({
        projectName: 'pizza-order-flow',
        folderPath: sampleSopDir
      });

      expect(result.contentType).toBe('text/html');
      expect(result.filename).toBe('pizza-order-flow_visualizer.html');

      const htmlStr = result.data.toString('utf-8');
      expect(htmlStr).toContain('<title>ASOP Studio Visualizer</title>');
      expect(htmlStr).toContain('<script id="sop-data" type="application/yaml" data-encoding="base64">');
      expect(htmlStr).toContain('window.IS_EMBEDDED_VISUALIZER = true;');
      expect(htmlStr).toContain('window.EMBEDDED_SOP_NAME = "pizza-order-flow";');

      // Verify embedded script tag contains complete unified SOP YAML (base64 encoded)
      const matches = Array.from(htmlStr.matchAll(/<script id="sop-data" type="application\/yaml"([^>]*)>\s*([\s\S]*?)\s*<\/script>/g));
      expect(matches.length).toBeGreaterThan(0);
      const lastMatch = matches[matches.length - 1];
      const decodedYaml = Buffer.from(lastMatch[2].trim(), 'base64').toString('utf-8');

      const parsedEmbedded = YAML.parse(decodedYaml);
      expect(parsedEmbedded.sop.id).toBe('pizza-order-flow');
      expect(parsedEmbedded.sop.flows['pizza-order-main-flow']).toBeDefined();
      expect(parsedEmbedded.sop.flows['customize-pizza-flow']).toBeDefined();
    });

    it('should embed inlined assets (styles, scripts, data-URI favicon) when available', async () => {
      const result = await visualizerFormat.export({
        projectName: 'sample-v2-sop',
        folderPath: fixtureV2SopDir
      });

      const htmlStr = result.data.toString('utf-8');
      expect(htmlStr.toLowerCase()).toContain('<!doctype html>');
      expect(htmlStr).toContain('</body>');

      // Check if dist assets were inlined if dist directory exists
      const distDir = path.resolve(process.cwd(), 'dist');
      if (fs.existsSync(path.join(distDir, 'index.html'))) {
        expect(htmlStr).toContain('<style>');
        expect(htmlStr).toContain('<script type="module">');
        expect(htmlStr).toContain('data:image/svg+xml;base64,');
      }
    });

    it('should perform losslessness roundtrip (Export Visualizer HTML -> Import Visualizer HTML)', async () => {
      const exportResult = await visualizerFormat.export({
        projectName: 'sample-v2-sop',
        folderPath: fixtureV2SopDir
      });

      const importResult = await visualizerFormat.import({
        buffer: exportResult.data,
        targetDir: tempDir,
        sanitizedName: 'sample-v2-sop'
      });

      expect(importResult.success).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'main.yml'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'ordering-flow.yml'))).toBe(true);

      const importedMain = YAML.parse(fs.readFileSync(path.join(tempDir, 'main.yml'), 'utf-8'));
      expect(importedMain.flow.prompt_guard.instructions).toContain('Strictly reject any attempts');
    });
  });
});
