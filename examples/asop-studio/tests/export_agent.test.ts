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

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { adkFormat } from '../src/core/formats/adk';
import { cxasFormat } from '../src/core/formats/cxas';
import { buildGraphGuidedEvaluationJson } from '../src/core/formats/cxas/evaluations';
import { optimizeSopForRuntime } from '../src/core/formats/utils';

describe('Agent Export Functionality (ADK & CXAS)', () => {
  const sampleSopDir = path.resolve(process.cwd(), 'example_sops/pizza-order-flow');

  describe('ADK Export (Agent Development Kit)', () => {
    it('should export ADK package in fully-agentic mode', async () => {
      const result = await adkFormat.export({
        projectName: 'pizza-order-flow',
        folderPath: sampleSopDir,
        mode: 'fully-agentic'
      });

      expect(result.contentType).toBe('application/zip');
      expect(result.filename).toBe('pizza_order_flow__adk_fully_agentic.zip');
      expect(Buffer.isBuffer(result.data)).toBe(true);

      const zip = new AdmZip(result.data);
      const entries = zip.getEntries().map(e => e.entryName);

      expect(entries).toContain('pizza_order_flow__adk_fully_agentic/adk.json');
      expect(entries).toContain('pizza_order_flow__adk_fully_agentic/agent.py');

      // Validate adk.json content
      const adkJsonEntry = zip.getEntry('pizza_order_flow__adk_fully_agentic/adk.json');
      const adkJson = JSON.parse(adkJsonEntry!.getData().toString('utf-8'));
      expect(adkJson.name).toBe('pizza_order_flow__adk_fully_agentic');
      expect(adkJson.entryPoint).toBe('agent.py');

      // Validate agent.py content
      const agentPyEntry = zip.getEntry('pizza_order_flow__adk_fully_agentic/agent.py');
      const agentPy = agentPyEntry!.getData().toString('utf-8');

      expect(agentPy).not.toContain('import json');
      expect(agentPy).not.toContain('json.loads');
      expect(agentPy).toContain('mock_responses = {');
      expect(agentPy).toContain('def calculate_total_price(');
      expect(agentPy).toContain('def place_pizza_order(');
      expect(agentPy).toContain('def get_pizza_menu(');
      expect(agentPy).toContain('def get_order_status(');
      expect(agentPy).toContain('def set_variables(');
      expect(agentPy).toContain('pizza_order_main_flow_agent = Agent(');
      expect(agentPy).toContain('main_agent = Agent(');
      expect(agentPy).toContain('root_agent = main_agent');
    });

    it('should export ADK package in graph-guided mode', async () => {
      const result = await adkFormat.export({
        projectName: 'pizza-order-flow',
        folderPath: sampleSopDir,
        mode: 'graph-guided'
      });

      expect(result.contentType).toBe('application/zip');
      expect(result.filename).toBe('pizza_order_flow__adk_graph_guided.zip');

      const zip = new AdmZip(result.data);
      const entries = zip.getEntries().map(e => e.entryName);

      expect(entries).toContain('pizza_order_flow__adk_graph_guided/adk.json');
      expect(entries).toContain('pizza_order_flow__adk_graph_guided/agent.py');

      const agentPyEntry = zip.getEntry('pizza_order_flow__adk_graph_guided/agent.py');
      const agentPy = agentPyEntry!.getData().toString('utf-8');

      expect(agentPy).not.toContain('import json');
      expect(agentPy).not.toContain('import base64');
      expect(agentPy).not.toContain('FLOW_SPEC_B64');
      expect(agentPy).not.toContain('json.loads');
      expect(agentPy).toContain('FLOW_SPEC = {');
      expect(agentPy).toContain('mock_responses = {');
      expect(agentPy).toContain('flow_agent = Agent(');
      expect(agentPy).toContain('def enter_node(');
      expect(agentPy).toContain('def start_pizza_order_flow(');
      expect(agentPy).toContain('def before_model_callback(');
      expect(agentPy).toContain('The structured flow has ended. 1) Send the last message to the customer. 2) terminate the conversation.');
      expect(agentPy).toContain('Fulfill all `accumulated_instructions` to terminate the conversation.');
    });
  });

  describe('CXAS Export (CX Agent Studio)', () => {
    it('should export CXAS package structure in fully-agentic mode', async () => {
      const result = await cxasFormat.export({
        projectName: 'pizza-order-flow',
        folderPath: sampleSopDir,
        mode: 'fully-agentic'
      });

      expect(result.contentType).toBe('application/zip');
      expect(result.filename).toBe('pizza-order-flow_cxas.zip');

      const zip = new AdmZip(result.data);
      const entries = zip.getEntries().map(e => e.entryName);

      expect(entries).toContain('pizza-order-flow/app.json');
      expect(entries).toContain('pizza-order-flow/environment.json');
      expect(entries).toContain('pizza-order-flow/agents/main/main.json');
      expect(entries).toContain('pizza-order-flow/agents/customize-pizza-flow/customize-pizza-flow.json');

      // Validate app.json variable declarations
      const appJsonEntry = zip.getEntry('pizza-order-flow/app.json');
      const appJson = JSON.parse(appJsonEntry!.getData().toString('utf-8'));
      expect(appJson.name).toBe('pizza-order-flow');
      expect(appJson.displayName).toBe('Pizza Order Flow');

      const varNames = (appJson.variableDeclarations as Array<{ name: string }>).map(v => v.name);
      expect(varNames).toContain('sop__order_id');
      expect(varNames).toContain('sop__session_customer_phone');

      // Validate tools generated and python formatting
      expect(entries).toContain('pizza-order-flow/tools/calculate_total_price/calculate_total_price.json');
      expect(entries).toContain('pizza-order-flow/tools/get_order_status/get_order_status.json');

      const toolPy = zip.getEntry('pizza-order-flow/tools/get_order_status/python_function/python_code.py')!.getData().toString('utf-8');
      expect(toolPy).not.toContain('import json');
      expect(toolPy).not.toContain('json.loads');
      expect(toolPy).toContain('mock_responses = {');

      // Validate evaluation test cases generated from example journeys
      const evalEntries = entries.filter(e => e.startsWith('pizza-order-flow/evaluations/'));
      expect(evalEntries.length).toBeGreaterThan(0);

      // Parse and validate Golden evaluation JSON content
      const goldenEntry = zip.getEntries().find(e => e.entryName.includes('/golden_'));
      expect(goldenEntry).toBeDefined();
      const goldenJson = JSON.parse(goldenEntry!.getData().toString('utf-8'));
      expect(goldenJson.displayName).toMatch(/^Golden - /);
      expect(Array.isArray(goldenJson.golden?.turns)).toBe(true);
      expect(goldenJson.golden.turns.length).toBeGreaterThan(0);

      // Verify that agentTransfer targetAgent references are normalized (no .yml extension artifact)
      interface EvalStep {
        expectation?: {
          agentTransfer?: {
            targetAgent?: string;
          };
          toolCall?: {
            tool?: string;
            args?: {
              flow_id?: string;
              node_id?: string;
            };
          };
        };
      }
      interface EvalTurn {
        steps?: EvalStep[];
      }

      const transfers = (goldenJson.golden.turns as EvalTurn[]).flatMap(t =>
        (t.steps || []).filter(s => s.expectation?.agentTransfer).map(s => s.expectation!.agentTransfer!.targetAgent!)
      );
      if (transfers.length > 0) {
        transfers.forEach((agent: string) => {
          expect(agent).not.toContain('.yml');
          expect(agent).not.toContain('_yml');
        });
      }

      // Parse and validate Scenario evaluation JSON content
      const scenarioEntry = zip.getEntries().find(e => e.entryName.includes('/scenario_'));
      expect(scenarioEntry).toBeDefined();
      const scenarioJson = JSON.parse(scenarioEntry!.getData().toString('utf-8'));
      expect(scenarioJson.displayName).toMatch(/^Scenario - /);
      expect(scenarioJson.scenario?.task).toBeDefined();
      expect(scenarioJson.scenario?.maxTurns).toBeGreaterThanOrEqual(10);
    });

    it('should export CXAS package structure in multi-agent graph-guided mode (default) and generate valid evaluations', async () => {
      const result = await cxasFormat.export({
        projectName: 'pizza-order-flow',
        folderPath: sampleSopDir,
        mode: 'graph-guided'
      });

      expect(result.contentType).toBe('application/zip');
      expect(result.filename).toBe('pizza-order-flow_cxas_graph_guided.zip');

      const zip = new AdmZip(result.data);
      const entries = zip.getEntries().map(e => e.entryName);

      expect(entries).toContain('pizza-order-flow/app.json');
      expect(entries).toContain('pizza-order-flow/agents/main/main.json');
      expect(entries).toContain('pizza-order-flow/agents/customize-pizza-flow/customize-pizza-flow.json');
      expect(entries).toContain('pizza-order-flow/agents/payment-delivery-flow/payment-delivery-flow.json');
      expect(entries).not.toContain('pizza-order-flow/tools/enter_node/enter_node.json');
      expect(entries).not.toContain('pizza-order-flow/tools/enter_node/python_function/python_code.py');
      expect(entries).toContain('pizza-order-flow/tools/pizza_order_main_flow_enter_node/pizza_order_main_flow_enter_node.json');
      expect(entries).toContain('pizza-order-flow/tools/customize_pizza_flow_enter_node/customize_pizza_flow_enter_node.json');
      expect(entries).toContain('pizza-order-flow/tools/payment_delivery_flow_enter_node/payment_delivery_flow_enter_node.json');

      // Verify specific enter_node python code has vendorized engine code and does not call tools.enter_node
      const mainEnterNodePy = zip.getEntry('pizza-order-flow/tools/pizza_order_main_flow_enter_node/python_function/python_code.py')!.getData().toString('utf-8');
      expect(mainEnterNodePy).not.toContain('import json');
      expect(mainEnterNodePy).not.toContain('FLOW_SPEC_JSON');
      expect(mainEnterNodePy).not.toContain('json.loads');
      expect(mainEnterNodePy).toContain('FLOW_DEFINITION = {');
      expect(mainEnterNodePy).toContain('FLOW_TO_AGENT_MAP = {');
      expect(mainEnterNodePy).toContain('FLOW_ROOT_NODES = {');
      expect(mainEnterNodePy).toContain('def pizza_order_main_flow_enter_node(');
      expect(mainEnterNodePy).not.toContain('tools.enter_node(');
      // Ensure traversal engine logic IS vendorized in specific flow tool
      expect(mainEnterNodePy).toContain('# VENDORIZED REPEATED ENGINE CODE');
      expect(mainEnterNodePy).toContain('def enter_node_wrapped(');
      expect(mainEnterNodePy).toContain('def evaluate_condition(');
      expect(mainEnterNodePy).toContain('def get_nested_value(');
      expect(mainEnterNodePy).toContain("(flow: '{item.get('flow_id')}', node: '{item.get('node_id')}')");
      // Ensure mock_responses and redundant runtime data are stripped from FLOW_DEFINITION
      expect(mainEnterNodePy).not.toContain('mock_responses');
      expect(mainEnterNodePy).not.toContain('review_requests');
      expect(mainEnterNodePy).not.toContain('example_journeys');
      expect(mainEnterNodePy).not.toContain('global_instructions');

      const customizeEnterNodePy = zip.getEntry('pizza-order-flow/tools/customize_pizza_flow_enter_node/python_function/python_code.py')!.getData().toString('utf-8');
      expect(customizeEnterNodePy).toContain('FLOW_DEFINITION = {');
      expect(customizeEnterNodePy).toContain('def customize_pizza_flow_enter_node(');
      expect(customizeEnterNodePy).not.toContain('tools.enter_node(');
      expect(customizeEnterNodePy).toContain('# VENDORIZED REPEATED ENGINE CODE');
      expect(customizeEnterNodePy).toContain('def enter_node_wrapped(');
      expect(customizeEnterNodePy).toContain('def evaluate_condition(');
      // Ensure mock_responses and review_requests are stripped from subflow FLOW_DEFINITION
      expect(customizeEnterNodePy).not.toContain('mock_responses');
      expect(customizeEnterNodePy).not.toContain('review_requests');
      expect(customizeEnterNodePy).not.toContain('rev-cust-01');

      // Verify before_model_callbacks for deterministic handoffs and first-turn enter_node optimization
      const mainBeforeModelPy = zip.getEntry('pizza-order-flow/agents/main/before_model_callbacks/before_model_callbacks_01/python_code.py')!.getData().toString('utf-8');
      expect(mainBeforeModelPy).toContain('def before_model_callback(');
      expect(mainBeforeModelPy).toContain('int__target_agent_handoff');
      expect(mainBeforeModelPy).toContain('Part.from_agent_transfer(agent=target_agent)');
      expect(mainBeforeModelPy).toContain('FLOW_ID = "pizza-order-main-flow"');
      expect(mainBeforeModelPy).toContain('ENTER_NODE_TOOL = "pizza_order_main_flow_enter_node"');
      expect(mainBeforeModelPy).toContain('if current_flow != FLOW_ID:');
      expect(mainBeforeModelPy).toContain('Part.from_function_call(');
      expect(mainBeforeModelPy).toContain('name=ENTER_NODE_TOOL');
      expect(mainBeforeModelPy).toContain('args={"node_id": target_node, "set_variables": {}}');

      // Verify main agent hierarchy and child agents tree, and that generic enter_node is NOT added to subagents' tools
      const mainJson = JSON.parse(zip.getEntry('pizza-order-flow/agents/main/main.json')!.getData().toString('utf-8'));
      expect(mainJson.childAgents).toContain('customize-pizza-flow');
      expect(mainJson.tools).toEqual(['pizza_order_main_flow_enter_node', 'end_session']);
      expect(mainJson.tools).not.toContain('enter_node');
      expect(mainJson.beforeModelCallbacks).toBeDefined();
      expect(mainJson.beforeModelCallbacks[0].pythonCode).toBe('agents/main/before_model_callbacks/before_model_callbacks_01/python_code.py');

      const mainInstruction = zip.getEntry('pizza-order-flow/agents/main/instruction.txt')!.getData().toString('utf-8');
      expect(mainInstruction).toContain('Execute the **Transition Loop**');
      expect(mainInstruction).toContain('an active enter node call is always present in your context');
      expect(mainInstruction).not.toContain('Initialization:');

      const customizeJson = JSON.parse(zip.getEntry('pizza-order-flow/agents/customize-pizza-flow/customize-pizza-flow.json')!.getData().toString('utf-8'));
      expect(customizeJson.childAgents).toContain('payment-delivery-flow');
      expect(customizeJson.tools).toEqual(['customize_pizza_flow_enter_node', 'end_session']);
      expect(customizeJson.tools).not.toContain('enter_node');
      expect(customizeJson.beforeModelCallbacks).toBeDefined();
      expect(customizeJson.beforeModelCallbacks[0].pythonCode).toBe('agents/customize-pizza-flow/before_model_callbacks/before_model_callbacks_01/python_code.py');

      const customizeBeforeModelPy = zip.getEntry('pizza-order-flow/agents/customize-pizza-flow/before_model_callbacks/before_model_callbacks_01/python_code.py')!.getData().toString('utf-8');
      expect(customizeBeforeModelPy).toContain('FLOW_ID = "customize-pizza-flow"');
      expect(customizeBeforeModelPy).toContain('ENTER_NODE_TOOL = "customize_pizza_flow_enter_node"');
      expect(customizeBeforeModelPy).toContain('Part.from_function_call(');

      // Verify business tools are still exported in tools/ directory and have proper mock fallback
      expect(entries).toContain('pizza-order-flow/tools/get_order_status/get_order_status.json');
      expect(entries).toContain('pizza-order-flow/tools/get_pizza_menu/get_pizza_menu.json');
      const toolPy = zip.getEntry('pizza-order-flow/tools/get_order_status/python_function/python_code.py')!.getData().toString('utf-8');
      expect(toolPy).not.toContain('import json');
      expect(toolPy).not.toContain('json.loads');
      expect(toolPy).toContain('mock_responses = {');
      expect(toolPy).toContain('result = mock_responses.get(journey, list(mock_responses.values())[0] if mock_responses else {})');

      // Verify golden evaluations
      const goldenEntry = zip.getEntries().find(e => e.entryName.includes('/golden_'));
      expect(goldenEntry).toBeDefined();
      const goldenJson = JSON.parse(goldenEntry!.getData().toString('utf-8'));
      expect(goldenJson.displayName).toMatch(/^Golden - /);
      expect(goldenJson.golden?.turns?.length).toBeGreaterThan(0);
    });

    it('should correctly resolve target flow root nodes for global routes and format FLOW_ROOT_NODES in CXAS multi-agent export', async () => {
      const result = await cxasFormat.export({
        projectName: 'pizza-order-flow',
        folderPath: sampleSopDir,
        mode: 'graph-guided'
      });

      const zip = new AdmZip(result.data);
      const enterNodeFiles = zip.getEntries().filter(e => e.entryName.includes('/python_function/python_code.py') && e.entryName.includes('_enter_node'));
      expect(enterNodeFiles.length).toBeGreaterThan(0);

      for (const entry of enterNodeFiles) {
        const pyCode = entry.getData().toString('utf-8');
        expect(pyCode).toContain('FLOW_ROOT_NODES = {');
        expect(pyCode).toContain('FLOW_DEFINITION = {');
        expect(pyCode).toContain('def enter_node_wrapped(');
        expect(pyCode).toContain("(flow: '{item.get('flow_id')}', node: '{item.get('node_id')}')");
        // Ensure that none of the MAIN_GLOBAL_INTENT_ROUTES or local routes have target_node: None when target_flow is specified
        if (pyCode.includes('MAIN_GLOBAL_INTENT_ROUTES = [')) {
          expect(pyCode).not.toMatch(/'target_flow': '[^']+',\s*'target_node': None/);
        }
      }
    });

    it('should preserve intermediate enter_node calls in graph-guided evaluation JSON', () => {
      const journey = {
        name: 'test-journey-with-intermediates',
        steps: [
          {
            user_says: 'Hi',
            current_node: 'greeting',
            agent_says: 'Hello! How can I help?'
          },
          {
            user_says: 'I want to check my active order status',
            current_node: 'check_order_start',
            intermediate_nodes: ['validate_customer', 'fetch_order_db'],
            agent_says: 'Your order status is active.'
          }
        ]
      };

      const sopSpec = {
        flows: [
          {
            id: 'main',
            nodes: [
              { id: 'greeting' },
              { id: 'check_order_start' },
              { id: 'validate_customer' },
              { id: 'fetch_order_db' }
            ]
          }
        ]
      };

      const evalJson = buildGraphGuidedEvaluationJson(journey, sopSpec, 'main', 'Test Journey');

      const enterNodeCalls: string[] = [];
      evalJson.golden.turns.forEach(turn => {
        turn.steps.forEach(step => {
          if (step.expectation?.toolCall?.tool === 'enter_node') {
            enterNodeCalls.push(step.expectation.toolCall.args.node_id as string);
          }
        });
      });

      expect(enterNodeCalls).toContain('greeting');
      expect(enterNodeCalls).toContain('check_order_start');
      expect(enterNodeCalls).toContain('validate_customer');
      expect(enterNodeCalls).toContain('fetch_order_db');
    });
  });

  describe('optimizeSopForRuntime helper', () => {
    it('should strip mock_responses, review_requests, prompt_guard, and global_instructions from unified SOP', () => {
      const unifiedSop = {
        sop: {
          id: 'test-sop',
          name: 'Test Sop',
          version: 2,
          global_instructions: 'Root global instructions',
          prompt_guard: 'Root prompt guard',
          review_requests: [{ id: 'rev-0', topic: 'DESIGN', reason: 'check', resolved: false }],
          example_journeys: [{ name: 'Journey 1', steps: [] }],
          flows: {
            main: {
              id: 'main',
              root_node_id: 'start',
              global_instructions: 'Flow global instructions',
              prompt_guard: 'Flow prompt guard',
              review_requests: [{ id: 'rev-1', topic: 'TECHNICAL', reason: 'flow check', resolved: false }],
              global_intent_routes: [
                {
                  intent: 'help',
                  target_node: 'help_node',
                  review_requests: [{ id: 'rev-route-0', topic: 'DESIGN', reason: 'route check', resolved: false }]
                }
              ],
              nodes: [
                {
                  id: 'start',
                  agent_instructions: 'Instructions for start node',
                  review_requests: [{ id: 'rev-node-0', topic: 'DESIGN', reason: 'node check', resolved: false }],
                  actions: [
                    {
                      type: 'tool',
                      tool_name: 'test_tool',
                      mock_responses: { default: { ok: true } },
                      review_requests: [{ id: 'rev-act-0', topic: 'TECHNICAL', reason: 'act check', resolved: false }]
                    }
                  ],
                  intent_routes: [
                    {
                      intent: 'proceed',
                      target_node: 'next',
                      review_requests: [{ id: 'rev-intent-0', topic: 'DESIGN', reason: 'intent check', resolved: false }]
                    }
                  ],
                  condition_routes: [
                    {
                      condition: 'val == 1',
                      target_node: 'next',
                      review_requests: [{ id: 'rev-cond-0', topic: 'TECHNICAL', reason: 'cond check', resolved: false }]
                    }
                  ]
                }
              ]
            }
          }
        }
      };

      const optimized = optimizeSopForRuntime(unifiedSop);

      expect(optimized.example_journeys).toBeUndefined();
      expect(optimized.global_instructions).toBeUndefined();
      expect(optimized.sop.example_journeys).toBeUndefined();
      expect(optimized.sop.global_instructions).toBeUndefined();
      expect(optimized.sop.prompt_guard).toBeUndefined();
      expect(optimized.sop.review_requests).toBeUndefined();

      const mainFlow = optimized.sop.flows.main;
      expect(mainFlow.global_instructions).toBeUndefined();
      expect(mainFlow.prompt_guard).toBeUndefined();
      expect(mainFlow.review_requests).toBeUndefined();
      expect(mainFlow.global_intent_routes[0].review_requests).toBeUndefined();

      const startNode = mainFlow.nodes[0];
      expect(startNode.agent_instructions).toBe('Instructions for start node');
      expect(startNode.review_requests).toBeUndefined();
      expect(startNode.actions[0].tool_name).toBe('test_tool');
      expect(startNode.actions[0].mock_responses).toBeUndefined();
      expect(startNode.actions[0].review_requests).toBeUndefined();
      expect(startNode.intent_routes[0].review_requests).toBeUndefined();
      expect(startNode.condition_routes[0].review_requests).toBeUndefined();
    });

    it('should strip mock_responses, review_requests, and unneeded fields from an individual flow object', () => {
      const singleFlow = {
        id: 'sub-flow',
        root_node_id: 'step1',
        global_instructions: 'Some subflow instructions',
        prompt_guard: 'Some subflow prompt guard',
        review_requests: [{ id: 'rev-sub-0', topic: 'DESIGN', reason: 'check', resolved: false }],
        nodes: [
          {
            id: 'step1',
            agent_instructions: 'Step 1 instructions',
            review_requests: [{ id: 'rev-node-1', topic: 'TECHNICAL', reason: 'check node', resolved: false }],
            actions: [
              {
                type: 'tool',
                tool_name: 'fetch_data',
                tool_params: { id: 'cust_id' },
                mock_responses: { default: { data: 123 }, journey_a: { data: 456 } },
                store_result_variable: 'cust_data',
                review_requests: [{ id: 'rev-act-1', topic: 'DESIGN', reason: 'check act', resolved: false }]
              }
            ],
            condition_routes: [
              {
                condition: 'cust_data.data == 123',
                target_node: 'step2',
                review_requests: [{ id: 'rev-cond-1', topic: 'TECHNICAL', reason: 'check cond', resolved: false }]
              }
            ]
          }
        ]
      };

      const optimized = optimizeSopForRuntime(singleFlow);

      expect(optimized.global_instructions).toBeUndefined();
      expect(optimized.prompt_guard).toBeUndefined();
      expect(optimized.review_requests).toBeUndefined();

      const node = optimized.nodes[0];
      expect(node.id).toBe('step1');
      expect(node.agent_instructions).toBe('Step 1 instructions');
      expect(node.review_requests).toBeUndefined();

      const action = node.actions[0];
      expect(action.type).toBe('tool');
      expect(action.tool_name).toBe('fetch_data');
      expect(action.tool_params).toEqual({ id: 'cust_id' });
      expect(action.store_result_variable).toBe('cust_data');
      expect(action.mock_responses).toBeUndefined();
      expect(action.review_requests).toBeUndefined();

      const cond = node.condition_routes[0];
      expect(cond.condition).toBe('cust_data.data == 123');
      expect(cond.target_node).toBe('step2');
      expect(cond.review_requests).toBeUndefined();
    });
  });
});
