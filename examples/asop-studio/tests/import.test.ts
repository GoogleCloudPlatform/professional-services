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
import fs from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
import YAML from 'yaml';
import { yamlFormat } from '../src/core/formats/yaml';
import { zipFormat } from '../src/core/formats/zip';
import { visualizerFormat } from '../src/core/formats/visualizer';
import { parseYamlToSopProject, validateSopProject } from '../src/common/sopCommon';

describe('SOP Import Functionality', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asop-test-import-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('YAML Format Import', () => {
    it('should import a single flow YAML file into main.yml', async () => {
      const singleFlowYaml = YAML.stringify({
        flow: {
          id: 'main',
          version: 2,
          name: 'Main Flow',
          root_node_id: 'start_node',
          nodes: [
            { id: 'start_node', agent_instructions: 'Greet user' }
          ]
        }
      });

      const result = await yamlFormat.import({
        buffer: Buffer.from(singleFlowYaml, 'utf-8'),
        targetDir: tempDir,
        sanitizedName: 'test-single'
      });

      expect(result.success).toBe(true);
      expect(result.name).toBe('test-single');

      const mainFile = path.join(tempDir, 'main.yml');
      expect(fs.existsSync(mainFile)).toBe(true);

      const parsed = YAML.parse(fs.readFileSync(mainFile, 'utf-8'));
      expect(parsed.flow.id).toBe('main');
      expect(parsed.flow.version).toBe(2);
    });

    it('should import a unified SOP YAML file with multiple flows and example journeys', async () => {
      const unifiedSopYaml = YAML.stringify({
        sop: {
          id: 'pizza-sop',
          name: 'Pizza Ordering SOP',
          version: 2,
          flows: {
            main: {
              name: 'Main Flow',
              root_node_id: 'greeting',
              global_intent_routes: [
                { intent: 'customize', target_flow: 'customize-pizza-flow' }
              ],
              nodes: [
                { id: 'greeting', agent_instructions: 'Welcome customer' }
              ]
            },
            'customize-pizza-flow': {
              name: 'Customize Pizza',
              root_node_id: 'select_crust',
              nodes: [
                { id: 'select_crust', agent_instructions: 'Ask for crust' }
              ]
            }
          },
          example_journeys: [
            {
              name: 'Order Journey',
              steps: [
                { current_flow: 'main', current_node: 'greeting' },
                { current_flow: 'customize-pizza-flow', current_node: 'select_crust' }
              ]
            }
          ]
        }
      });

      const result = await yamlFormat.import({
        buffer: Buffer.from(unifiedSopYaml, 'utf-8'),
        targetDir: tempDir,
        sanitizedName: 'pizza-sop'
      });

      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'main.yml'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'customize-pizza-flow.yml'))).toBe(true);

      // Verify route rewriting in main.yml
      const mainParsed = YAML.parse(fs.readFileSync(path.join(tempDir, 'main.yml'), 'utf-8'));
      expect(mainParsed.flow.global_intent_routes[0].target_flow).toBe('customize-pizza-flow.yml');
      expect(mainParsed.example_journeys[0].steps[1].current_flow).toBe('customize-pizza-flow.yml');
    });

    it('should throw error when importing invalid YAML missing sop.id', () => {
      const invalidYaml = YAML.stringify({
        sop: {
          name: 'Missing ID SOP',
          version: 2,
          flows: {}
        }
      });

      expect(() => parseYamlToSopProject(invalidYaml, 'test')).toThrow('missing "sop.id"');
    });

    it('should throw error when importing invalid YAML missing sop.version', () => {
      const invalidYaml = YAML.stringify({
        sop: {
          id: 'no-version',
          name: 'No Version SOP',
          flows: { main: { name: 'Main' } }
        }
      });

      expect(() => parseYamlToSopProject(invalidYaml, 'test')).toThrow('missing "sop.version"');
    });

    it('should throw error when flow version is missing or inconsistent', () => {
      const project = {
        mainFile: 'main.yml',
        files: {
          'main.yml': YAML.stringify({ flow: { id: 'main', version: 2 } }),
          'sub.yml': YAML.stringify({ flow: { id: 'sub', version: 1 } })
        }
      };

      expect(() => validateSopProject(project)).toThrow('Consistent spec version mismatch');
    });
  });

  describe('ZIP Format Import', () => {
    it('should extract all flow files from a ZIP archive', async () => {
      const zip = new AdmZip();
      zip.addFile('main.yml', Buffer.from(YAML.stringify({
        flow: { id: 'main', version: 2, root_node_id: 'n1', nodes: [{ id: 'n1' }] }
      }), 'utf-8'));
      zip.addFile('payment.yml', Buffer.from(YAML.stringify({
        flow: { id: 'payment', version: 2, root_node_id: 'p1', nodes: [{ id: 'p1' }] }
      }), 'utf-8'));

      const zipBuffer = zip.toBuffer();

      const result = await zipFormat.import({
        buffer: zipBuffer,
        targetDir: tempDir,
        sanitizedName: 'test-zip'
      });

      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'main.yml'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'payment.yml'))).toBe(true);
    });

    it('should unwrap a single top-level directory wrapper in a ZIP', async () => {
      const zip = new AdmZip();
      zip.addFile('wrapper-folder/main.yml', Buffer.from(YAML.stringify({
        flow: { id: 'main', version: 2, root_node_id: 'n1', nodes: [{ id: 'n1' }] }
      }), 'utf-8'));

      const result = await zipFormat.import({
        buffer: zip.toBuffer(),
        targetDir: tempDir,
        sanitizedName: 'test-wrapper'
      });

      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'main.yml'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'wrapper-folder'))).toBe(false);
    });

    it('should throw error and clean up target directory on version mismatch in ZIP', async () => {
      const zip = new AdmZip();
      zip.addFile('main.yml', Buffer.from(YAML.stringify({
        flow: { id: 'main', version: 2 }
      }), 'utf-8'));
      zip.addFile('other.yml', Buffer.from(YAML.stringify({
        flow: { id: 'other', version: 99 }
      }), 'utf-8'));

      await expect(zipFormat.import({
        buffer: zip.toBuffer(),
        targetDir: tempDir,
        sanitizedName: 'bad-zip'
      })).rejects.toThrow('version mismatch');

      expect(fs.existsSync(tempDir)).toBe(false);
    });
  });

  describe('Visualizer Format Import', () => {
    it('should extract embedded YAML from visualizer HTML and import files', async () => {
      const embeddedYaml = YAML.stringify({
        sop: {
          id: 'visualizer-sop',
          name: 'Visualizer Test SOP',
          version: 2,
          flows: {
            main: {
              name: 'Main Flow',
              root_node_id: 'n1',
              nodes: [{ id: 'n1', agent_instructions: 'Do something' }]
            }
          }
        }
      });

      const htmlContent = `<!DOCTYPE html>
<html>
<head><title>ASOP Studio Visualizer</title></head>
<body>
<div id="root"></div>
<script id="sop-data" type="application/yaml">
${embeddedYaml}
</script>
</body>
</html>`;

      const result = await visualizerFormat.import({
        buffer: Buffer.from(htmlContent, 'utf-8'),
        targetDir: tempDir,
        sanitizedName: 'visualizer-test'
      });

      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'main.yml'))).toBe(true);

      const parsed = YAML.parse(fs.readFileSync(path.join(tempDir, 'main.yml'), 'utf-8'));
      expect(parsed.flow.id).toBe('main');
    });

    it('should throw error if embedded SOP data script tag is missing', async () => {
      const htmlContent = `<!DOCTYPE html><html><body>No SOP data here</body></html>`;

      await expect(visualizerFormat.import({
        buffer: Buffer.from(htmlContent, 'utf-8'),
        targetDir: tempDir,
        sanitizedName: 'bad-html'
      })).rejects.toThrow('Could not find embedded SOP data');
    });
  });
});
