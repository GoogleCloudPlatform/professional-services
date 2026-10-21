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
import { mountSubagent } from '../src/core/formats/cxas/mount';

describe('Mount Agent Functionality', () => {
  const sampleSopDir = path.resolve(process.cwd(), 'example_sops/pizza-order-flow');
  const targetNoToolsSource = path.resolve(process.cwd(), 'tests/fixtures/mount_target_no_tools');
  const targetWithToolsSource = path.resolve(process.cwd(), 'tests/fixtures/mount_target_with_tools');

  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asop-test-mount-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should fail mount and list all missing tools when mounting to a target without tools', async () => {
    // Copy the no-tools mount target fixture to tempDir for test isolation
    const testTargetDir = path.join(tempDir, 'no_tools_target');
    fs.cpSync(targetNoToolsSource, testTargetDir, { recursive: true });

    let caughtError: Error | null = null;
    try {
      await mountSubagent({
        sourceSopDir: sampleSopDir,
        targetDir: testTargetDir,
        subagentName: 'pizza_subagent',
        engine: 'fully-agentic',
        prefix: 'p_'
      });
    } catch (err: any) {
      caughtError = err;
    }

    expect(caughtError).not.toBeNull();
    const message = caughtError!.message;

    expect(message).toContain('Tools consistency check failed');
    expect(message).toContain('Missing tools in target agent:');
    expect(message).toContain('calculate_total_price');
    expect(message).toContain('get_order_status');
    expect(message).toContain('get_pizza_menu');
    expect(message).toContain('place_pizza_order');
  });

  it('should succeed mount and update target structure when mounting to a target with tools (fully-agentic)', async () => {
    // Copy the with-tools mount target fixture to tempDir for test isolation
    const testTargetDir = path.join(tempDir, 'with_tools_target');
    fs.cpSync(targetWithToolsSource, testTargetDir, { recursive: true });

    await mountSubagent({
      sourceSopDir: sampleSopDir,
      targetDir: testTargetDir,
      subagentName: 'pizza_subagent',
      engine: 'fully-agentic',
      prefix: 'p_'
    });

    // 1. Verify subagent files were created
    const subagentDir = path.join(testTargetDir, 'agents', 'pizza_subagent');
    expect(fs.existsSync(subagentDir)).toBe(true);
    expect(fs.existsSync(path.join(subagentDir, 'pizza_subagent.json'))).toBe(true);
    expect(fs.existsSync(path.join(subagentDir, 'instruction.txt'))).toBe(true);

    const subagentJson = JSON.parse(fs.readFileSync(path.join(subagentDir, 'pizza_subagent.json'), 'utf-8'));
    expect(subagentJson.name).toBe('pizza_subagent');

    // 2. Verify subagent was registered in root agent (Root_agent.json)
    const rootAgentJsonPath = path.join(testTargetDir, 'agents', 'Root_agent', 'Root_agent.json');
    expect(fs.existsSync(rootAgentJsonPath)).toBe(true);
    const rootMetadata = JSON.parse(fs.readFileSync(rootAgentJsonPath, 'utf-8'));
    expect(rootMetadata.childAgents).toContain('pizza_subagent');

    // 3. Verify variables were merged into target app.json
    const appJsonPath = path.join(testTargetDir, 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    const varNames = appJson.variableDeclarations.map((v: any) => v.name);
    expect(varNames).toContain('sop__order_id');
    expect(varNames).toContain('sop__session_customer_phone');

    // 4. Verify framework tools (with prefix) were copied
    expect(fs.existsSync(path.join(testTargetDir, 'tools', 'p_set_variables'))).toBe(true);

    // 5. Verify evaluations were copied with prefix
    const evalDir = path.join(testTargetDir, 'evaluations');
    expect(fs.existsSync(evalDir)).toBe(true);
    const evalFolders = fs.readdirSync(evalDir);
    expect(evalFolders.some(f => f.startsWith('p_'))).toBe(true);
  });

  it('should succeed mount and update target structure when mounting in graph-guided mode', async () => {
    const testTargetDir = path.join(tempDir, 'graph_guided_target');
    fs.cpSync(targetWithToolsSource, testTargetDir, { recursive: true });

    await mountSubagent({
      sourceSopDir: sampleSopDir,
      targetDir: testTargetDir,
      subagentName: 'pizza_subagent',
      engine: 'graph-guided',
      prefix: 'p_'
    });

    // Verify main subagent and child subflow agents were mounted
    expect(fs.existsSync(path.join(testTargetDir, 'agents', 'pizza_subagent'))).toBe(true);
    expect(fs.existsSync(path.join(testTargetDir, 'agents', 'p_customize-pizza-flow'))).toBe(true);
    expect(fs.existsSync(path.join(testTargetDir, 'agents', 'p_payment-delivery-flow'))).toBe(true);

    // Verify evaluations were copied with prefix
    const evalDir = path.join(testTargetDir, 'evaluations');
    const pGoldenFolder = fs.readdirSync(evalDir).find(f => f.startsWith('p_golden_'));
    expect(pGoldenFolder).toBeDefined();

    // Verify framework flow-prefixed enter_node tools were created with prefix
    expect(fs.existsSync(path.join(testTargetDir, 'tools', 'p_pizza_order_main_flow_enter_node'))).toBe(true);
    expect(fs.existsSync(path.join(testTargetDir, 'tools', 'p_customize_pizza_flow_enter_node'))).toBe(true);
  });


  it('should only mount global instructions when globalInstructions selector is set', async () => {
    const testTargetDir = path.join(tempDir, 'global_inst_target');
    fs.cpSync(targetWithToolsSource, testTargetDir, { recursive: true });

    await mountSubagent({
      sourceSopDir: sampleSopDir,
      targetDir: testTargetDir,
      subagentName: 'pizza_subagent',
      engine: 'fully-agentic',
      prefix: 'p_',
      globalInstructions: true
    });

    // Global instruction file should exist in target
    expect(fs.existsSync(path.join(testTargetDir, 'global_instruction.txt'))).toBe(true);

    // Agent files should NOT be created
    expect(fs.existsSync(path.join(testTargetDir, 'agents', 'pizza_subagent'))).toBe(false);

    // Evaluations should NOT be created
    const evalDir = path.join(testTargetDir, 'evaluations');
    expect(fs.existsSync(evalDir) && fs.readdirSync(evalDir).some(f => f.startsWith('p_'))).toBe(false);
  });

  it('should only mount golden evals when goldenEvals selector is set', async () => {
    const testTargetDir = path.join(tempDir, 'golden_evals_target');
    fs.cpSync(targetWithToolsSource, testTargetDir, { recursive: true });

    await mountSubagent({
      sourceSopDir: sampleSopDir,
      targetDir: testTargetDir,
      subagentName: 'pizza_subagent',
      engine: 'fully-agentic',
      prefix: 'p_',
      goldenEvals: true
    });

    // Agent files should NOT be created
    expect(fs.existsSync(path.join(testTargetDir, 'agents', 'pizza_subagent'))).toBe(false);

    // Evaluations directory should exist
    const evalDir = path.join(testTargetDir, 'evaluations');
    expect(fs.existsSync(evalDir)).toBe(true);
    const evalFolders = fs.readdirSync(evalDir);
    expect(evalFolders.some(f => f.includes('golden'))).toBe(true);
    expect(evalFolders.some(f => f.includes('scenario'))).toBe(false);
  });

  it('should only mount scenario evals when scenarioEvals selector is set', async () => {
    const testTargetDir = path.join(tempDir, 'scenario_evals_target');
    fs.cpSync(targetWithToolsSource, testTargetDir, { recursive: true });

    await mountSubagent({
      sourceSopDir: sampleSopDir,
      targetDir: testTargetDir,
      subagentName: 'pizza_subagent',
      engine: 'fully-agentic',
      prefix: 'p_',
      scenarioEvals: true
    });

    // Agent files should NOT be created
    expect(fs.existsSync(path.join(testTargetDir, 'agents', 'pizza_subagent'))).toBe(false);

    // Evaluations directory should exist
    const evalDir = path.join(testTargetDir, 'evaluations');
    expect(fs.existsSync(evalDir)).toBe(true);
    const evalFolders = fs.readdirSync(evalDir);
    expect(evalFolders.some(f => f.includes('scenario'))).toBe(true);
    expect(evalFolders.some(f => f.includes('golden'))).toBe(false);
  });

  it('should only mount agent files when agent selector is set', async () => {
    const testTargetDir = path.join(tempDir, 'agent_only_target');
    fs.cpSync(targetWithToolsSource, testTargetDir, { recursive: true });

    await mountSubagent({
      sourceSopDir: sampleSopDir,
      targetDir: testTargetDir,
      subagentName: 'pizza_subagent',
      engine: 'fully-agentic',
      prefix: 'p_',
      agent: true
    });

    // Subagent directory should be created
    expect(fs.existsSync(path.join(testTargetDir, 'agents', 'pizza_subagent'))).toBe(true);

    // Evaluations should NOT be created
    const evalDir = path.join(testTargetDir, 'evaluations');
    expect(fs.existsSync(evalDir) && fs.readdirSync(evalDir).some(f => f.startsWith('p_'))).toBe(false);
  });
});
