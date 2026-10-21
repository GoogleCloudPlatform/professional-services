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
import {
  buildGraphGuidedEvaluationJson,
  buildFullyAgenticEvaluationJson,
  buildScenarioEvaluationJson,
  findFlowIdForNode,
  findNodeInSop,
  Journey
} from '../src/core/formats/cxas/evaluations';

describe('CXAS Evaluation Rendering Engine', () => {
  const sampleSopSpec = {
    flows: {
      main: {
        id: 'main',
        nodes: [
          { id: 'start_node' },
          { id: 'greeting' },
          {
            id: 'lookup_order',
            actions: [
              {
                type: 'tool',
                tool_name: 'get_order_status',
                mock_responses: {
                  default: { status: 'UNKNOWN' },
                  happy_path: { status: 'DELIVERED', order_id: '12345' }
                }
              }
            ]
          }
        ]
      },
      'customize-pizza-flow': {
        id: 'customize-pizza-flow',
        nodes: [
          { id: 'select_crust' },
          {
            id: 'calculate_price',
            actions: [
              {
                type: 'tool',
                tool_name: 'calculate_total_price',
                mock_responses: {
                  default: { total: 15.99 }
                }
              }
            ]
          }
        ]
      }
    }
  };

  describe('Graph-Guided Evaluation Builder (buildGraphGuidedEvaluationJson)', () => {
    it('should generate accurate step sequence for a multi-turn journey with intermediate nodes', () => {
      const journey: Journey = {
        name: 'order_status_journey',
        steps: [
          {
            user_says: 'Hi, I want to check my order status',
            current_flow: 'main',
            current_node: 'greeting',
            mock_journey: 'happy_path',
            agent_says: 'Sure, let me check that for you.'
          },
          {
            user_says: 'My order ID is 12345',
            current_flow: 'main',
            current_node: 'start_node',
            intermediate_nodes: ['lookup_order'],
            agent_says: 'Your order 12345 is delivered.'
          }
        ]
      };

      const result = buildGraphGuidedEvaluationJson(journey, sampleSopSpec, 'main', 'Golden - Order Status');

      expect(result.displayName).toBe('Golden - Order Status');
      expect(typeof result.name).toBe('string');
      expect(result.golden.turns).toHaveLength(3);

      // --- Turn 0 (Conversation Start) ---
      const turn0 = result.golden.turns[0];
      // 1. Variable override for ui__mock_journey
      expect(turn0.steps[0]).toEqual({
        userInput: {
          variables: {
            ui__mock_journey: 'happy_path'
          }
        }
      });
      // 2. conversation-start event
      expect(turn0.steps[1]).toEqual({
        userInput: {
          event: {
            event: 'conversation-start'
          }
        }
      });
      // 3. Turn 0 Agent Transfer expectation to flow_agent
      expect(turn0.steps[2]).toEqual({
        expectation: {
          agentTransfer: {
            targetAgent: 'flow_agent'
          }
        }
      });
      // 4. enter_node toolCall & toolResponse for greeting
      expect(turn0.steps[3].expectation?.toolCall?.tool).toBe('enter_node');
      expect(turn0.steps[3].expectation?.toolCall?.args).toEqual({
        node_id: 'greeting',
        flow_id: 'main',
        set_variables: {}
      });
      const toolCallId0 = turn0.steps[3].expectation?.toolCall?.id;
      expect(turn0.steps[4].expectation?.toolResponse).toEqual({
        id: toolCallId0,
        tool: 'enter_node',
        response: { result: { status: 'success' } }
      });
      // 5. agentResponse for Turn 0
      expect(turn0.steps[turn0.steps.length - 1]).toEqual({
        expectation: {
          agentResponse: {
            role: 'agent',
            chunks: [{ text: 'Sure, let me check that for you.' }]
          }
        }
      });

      // --- Turn 1 (User Turn 1) ---
      const turn1 = result.golden.turns[1];
      expect(turn1.steps[0]).toEqual({
        userInput: { text: 'Hi, I want to check my order status' }
      });

      // Collect enter_node calls in Turn 1
      const turn1Nodes = turn1.steps
        .filter(s => s.expectation?.toolCall?.tool === 'enter_node')
        .map(s => s.expectation?.toolCall?.args.node_id);

      expect(turn1Nodes).toEqual(['lookup_order', 'start_node']);

      // --- Turn 2 (User Turn 2) ---
      const turn2 = result.golden.turns[2];
      expect(turn2.steps[0]).toEqual({
        userInput: { text: 'My order ID is 12345' }
      });
    });

    it('edge case: should deduplicate adjacent identical node transitions across turns', () => {
      const journey: Journey = {
        name: 'dedup_journey',
        steps: [
          {
            user_says: 'Hello',
            current_node: 'greeting',
            intermediate_nodes: ['greeting', 'greeting'],
            agent_says: 'Hello there!'
          }
        ]
      };

      const result = buildGraphGuidedEvaluationJson(journey, sampleSopSpec, 'main', 'Golden - Dedup');
      const enterCalls = result.golden.turns[0].steps.filter(s => s.expectation?.toolCall?.tool === 'enter_node');
      
      // Should be deduplicated down to exactly 1 enter_node call for 'greeting' in Turn 0
      expect(enterCalls).toHaveLength(1);
      expect(enterCalls[0].expectation?.toolCall?.args.node_id).toBe('greeting');
    });

    it('edge case: should preserve multi-node traversal when transitioning between flows', () => {
      const journey: Journey = {
        name: 'cross_flow_journey',
        steps: [
          {
            user_says: 'Start',
            current_flow: 'main',
            current_node: 'start_node',
            intermediate_nodes: ['select_crust'],
            agent_says: 'Selecting crust'
          }
        ]
      };

      const result = buildGraphGuidedEvaluationJson(journey, sampleSopSpec, 'main', 'Golden - Cross Flow');
      const enterCalls = result.golden.turns[0].steps
        .filter(s => s.expectation?.toolCall?.tool === 'enter_node')
        .map(s => s.expectation?.toolCall?.args);

      expect(enterCalls).toEqual([
        { node_id: 'start_node', flow_id: 'main', set_variables: {} },
        { node_id: 'select_crust', flow_id: 'customize-pizza-flow', set_variables: {} }
      ]);
    });

    it('should normalize flow IDs and strip .yml / .yaml extensions in enter_node calls', () => {
      const journey: Journey = {
        name: 'extension_flow_journey',
        steps: [
          {
            user_says: 'Start',
            current_flow: 'main.yml',
            current_node: 'start_node',
            intermediate_nodes: ['select_crust'],
            agent_says: 'Selecting crust'
          },
          {
            user_says: 'Next step',
            current_flow: 'customize-pizza-flow.yaml',
            current_node: 'calculate_price',
            agent_says: 'Calculating'
          }
        ]
      };

      const result = buildGraphGuidedEvaluationJson(journey, sampleSopSpec, 'main', 'Golden - Extension Flow');
      const enterCalls = result.golden.turns[0].steps
        .filter(s => s.expectation?.toolCall?.tool === 'enter_node')
        .map(s => s.expectation?.toolCall?.args);

      expect(enterCalls[0].flow_id).toBe('main');
      expect(enterCalls[1].flow_id).toBe('customize-pizza-flow');
    });

    it('issue 1 & 2 fix: should correctly separate turn agent responses and filter condition-only node calls', () => {
      const sopWithConditionRoutes = {
        flows: {
          main: {
            id: 'main',
            root_node_id: 'welcome-node',
            global_intent_routes: [
              { intent: 'Track order', target_node: 'track-order-triage' }
            ],
            nodes: [
              { id: 'welcome-node', agent_instructions: 'Welcome customer' },
              {
                id: 'track-order-triage',
                condition_routes: [
                  { condition: 'order_info.order_found == true', target_node: 'explain-order-status' }
                ]
              },
              {
                id: 'explain-order-status',
                agent_instructions: 'Explain order status',
                intent_routes: [
                  { intent: 'No other requests', target_node: 'END' }
                ]
              }
            ]
          }
        }
      };

      const journey: Journey = {
        name: 'Checking Active Order Status',
        steps: [
          {
            agent_says: "Welcome to Luigi's Pizza! How can I help you today?",
            user_says: 'Can you track my pizza order?',
            current_flow: 'main',
            current_node: 'welcome-node'
          },
          {
            agent_says: 'Let me check that for you... I found your order!',
            user_says: "No, that's perfect. Thanks!",
            current_flow: 'main',
            current_node: 'explain-order-status',
            intermediate_nodes: ['track-order-triage']
          },
          {
            agent_says: "You're very welcome! Enjoy your pizza, and have a great day!",
            current_flow: 'main',
            current_node: 'END'
          }
        ]
      };

      const result = buildGraphGuidedEvaluationJson(journey, sopWithConditionRoutes, 'main', 'Golden - Order Tracking');

      // Turn 1 (User says "Can you track my pizza order?")
      const turn1 = result.golden.turns[1];
      
      // Issue 2: enter_node should ONLY be called on "track-order-triage" (intent transition), NOT on "explain-order-status" (condition transition)
      const turn1EnterCalls = turn1.steps
        .filter(s => s.expectation?.toolCall?.tool === 'enter_node')
        .map(s => s.expectation?.toolCall?.args.node_id);

      expect(turn1EnterCalls).toEqual(['track-order-triage']);

      // Issue 1: agentResponse for Turn 1 should ONLY contain Step 1's agent_says, NOT Step 2's agent_says
      const turn1Response = turn1.steps.find(s => s.expectation?.agentResponse)?.expectation?.agentResponse?.chunks[0].text;
      expect(turn1Response).toBe('Let me check that for you... I found your order!');
      expect(turn1Response).not.toContain("You're very welcome!");

      // Turn 2 (User says "No, that's perfect. Thanks!")
      const turn2 = result.golden.turns[2];
      const turn2EnterCalls = turn2.steps
        .filter(s => s.expectation?.toolCall?.tool === 'enter_node')
        .map(s => s.expectation?.toolCall?.args.node_id);

      expect(turn2EnterCalls).toEqual(['END']);

      const turn2EndSessionCalls = turn2.steps
        .filter(s => s.expectation?.toolCall?.tool === 'end_session');
      expect(turn2EndSessionCalls).toHaveLength(1);

      const turn2Response = turn2.steps.find(s => s.expectation?.agentResponse)?.expectation?.agentResponse?.chunks[0].text;
      expect(turn2Response).toBe("You're very welcome! Enjoy your pizza, and have a great day!");
    });

    it('edge case: should issue warning when two nodes are connected by BOTH intent and condition routes', () => {
      const dualRouteSop = {
        flows: {
          main: {
            id: 'main',
            nodes: [
              { id: 'nodeA' },
              {
                id: 'nodeB',
                intent_routes: [{ intent: 'Go to C', target_node: 'nodeC' }],
                condition_routes: [{ condition: 'flag == true', target_node: 'nodeC' }]
              },
              { id: 'nodeC' }
            ]
          }
        }
      };

      const journey: Journey = {
        name: 'dual_route_journey',
        steps: [
          {
            user_says: 'Step 1',
            current_node: 'nodeB',
            agent_says: 'At node B'
          },
          {
            user_says: 'Step 2',
            current_node: 'nodeC',
            agent_says: 'At node C'
          }
        ]
      };

      const result = buildGraphGuidedEvaluationJson(journey, dualRouteSop, 'main', 'Golden - Dual Route');

      // Warning should be generated
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("connected by BOTH intent and condition routes");

      // enter_node assertion for nodeC should be included
      const turn1EnterCalls = result.golden.turns[1].steps
        .filter(s => s.expectation?.toolCall?.tool === 'enter_node')
        .map(s => s.expectation?.toolCall?.args.node_id);

      expect(turn1EnterCalls).toContain('nodeC');
    });

    it('self-loop fix: should generate enter_node tool expectation when a self-loop intent route is triggered', () => {
      const selfLoopSop = {
        flows: {
          'customize-pizza-flow': {
            id: 'customize-pizza-flow',
            nodes: [
              {
                id: 'add-toppings-triage',
                intent_routes: [
                  { intent: 'Add extra cheese', target_node: 'add-toppings-triage' }
                ]
              }
            ]
          }
        }
      };

      const journey: Journey = {
        name: 'self_loop_journey',
        steps: [
          {
            user_says: 'What toppings would you like?',
            current_flow: 'customize-pizza-flow',
            current_node: 'add-toppings-triage',
            agent_says: 'Would you like extra cheese?'
          },
          {
            user_says: 'Please add extra cheese',
            current_flow: 'customize-pizza-flow',
            current_node: 'add-toppings-triage',
            agent_says: 'Got it, extra cheese added.'
          }
        ]
      };

      const result = buildGraphGuidedEvaluationJson(journey, selfLoopSop, 'customize-pizza-flow', 'Golden - Self Loop');

      // Turn 1 (User says "Please add extra cheese")
      const turn1 = result.golden.turns[1];
      const turn1EnterCalls = turn1.steps
        .filter(s => s.expectation?.toolCall?.tool === 'enter_node')
        .map(s => s.expectation?.toolCall?.args.node_id);

      expect(turn1EnterCalls).toEqual(['add-toppings-triage']);
    });
  });

  describe('Fully-Agentic Evaluation Builder (buildFullyAgenticEvaluationJson)', () => {
    it('should generate agent transfers and tool call expectations for custom actions', () => {
      const journey: Journey = {
        name: 'agentic_journey',
        steps: [
          {
            user_says: 'I want to customize my pizza',
            current_flow: 'customize-pizza-flow',
            current_node: 'select_crust',
            mock_journey: 'happy_path',
            agent_says: 'What crust would you like?'
          },
          {
            user_says: 'Thin crust please',
            current_flow: 'customize-pizza-flow',
            current_node: 'calculate_price',
            agent_says: 'Your total is $15.99.'
          }
        ]
      };

      const result = buildFullyAgenticEvaluationJson(journey, sampleSopSpec, 'main', 'Golden - Fully Agentic');

      expect(result.displayName).toBe('Golden - Fully Agentic');
      const turn0 = result.golden.turns[0];

      // Turn 0 should have conversation-start event
      expect(turn0.steps[1]).toEqual({
        userInput: {
          event: {
            event: 'conversation-start'
          }
        }
      });

      // Expect agent transfer from main to customize-pizza-flow in Turn 0
      const transferStep = turn0.steps.find(s => s.expectation?.agentTransfer);
      expect(transferStep?.expectation?.agentTransfer?.targetAgent).toBe('customize-pizza-flow');

      // Expect NO enter_node tool calls in fully-agentic mode
      const enterNodeCalls = turn0.steps.filter(s => s.expectation?.toolCall?.tool === 'enter_node');
      expect(enterNodeCalls).toHaveLength(0);

      // Turn 1 contains tool call expectation for calculate_total_price via nextStep transition
      const turn1 = result.golden.turns[1];
      expect(turn1.steps[0]).toEqual({
        userInput: { text: 'I want to customize my pizza' }
      });

      const toolCallStep = turn1.steps.find(s => s.expectation?.toolCall?.tool === 'calculate_total_price');
      expect(toolCallStep).toBeDefined();

      const toolRespStep = turn1.steps.find(s => s.expectation?.toolResponse?.tool === 'calculate_total_price');
      expect(toolRespStep?.expectation?.toolResponse?.response.result).toEqual({ total: 15.99 });
    });

    it('should normalize targetAgent references in agentTransfer for fully-agentic mode when flow IDs contain .yml extensions', () => {
      const journey: Journey = {
        name: 'agentic_extension_journey',
        steps: [
          {
            user_says: 'I want to customize my pizza',
            current_flow: 'customize-pizza-flow.yml',
            current_node: 'select_crust',
            agent_says: 'What crust would you like?'
          }
        ]
      };

      const result = buildFullyAgenticEvaluationJson(journey, sampleSopSpec, 'main', 'Golden - Agentic Extension');
      const turn0 = result.golden.turns[0];

      const transferStep = turn0.steps.find(s => s.expectation?.agentTransfer);
      expect(transferStep).toBeDefined();
      expect(transferStep?.expectation?.agentTransfer?.targetAgent).toBe('customize-pizza-flow');
    });
  });

  describe('Scenario Evaluation Builder (buildScenarioEvaluationJson)', () => {
    it('should generate script replication task prompt and maxTurns calculation', () => {
      const journey: Journey = {
        name: 'scenario_journey',
        steps: [
          { user_says: 'Hi', agent_says: 'Hello' },
          { user_says: 'Help', agent_says: 'Sure' },
          { user_says: 'Bye', agent_says: 'Goodbye' }
        ]
      };

      const result = buildScenarioEvaluationJson(journey, 'Scenario - Test');

      expect(result.displayName).toBe('Scenario - Test');
      expect(result.scenario.maxTurns).toBe(10); // Math.max(10, 3 + 5) = 10
      expect(result.scenario.taskCompletionBehavior).toBe('TASK_SATISFIED');
      expect(result.scenario.userGoalBehavior).toBe('USER_GOAL_SATISFIED');
      expect(result.scenario.task).toContain('user_says: "Hi"');
      expect(result.scenario.task).toContain('agent_says: "Hello"');
      expect(result.scenario.variableOverrides.ui__mock_journey).toBe('default');
    });

    it('edge case: should scale maxTurns dynamically for long conversations', () => {
      const steps = Array.from({ length: 15 }, (_, i) => ({
        user_says: `User msg ${i}`,
        agent_says: `Agent msg ${i}`
      }));

      const journey: Journey = { name: 'long_journey', steps };
      const result = buildScenarioEvaluationJson(journey, 'Scenario - Long');

      // 15 user turns + 5 = 20 max turns
      expect(result.scenario.maxTurns).toBe(20);
    });
  });

  describe('Utility Functions (findFlowIdForNode & findNodeInSop)', () => {
    it('should resolve flow ID for a given node ID correctly', () => {
      expect(findFlowIdForNode('select_crust', sampleSopSpec, 'main')).toBe('customize-pizza-flow');
      expect(findFlowIdForNode('greeting', sampleSopSpec, 'main')).toBe('main');
      expect(findFlowIdForNode('non_existent_node', sampleSopSpec, 'fallback')).toBe('fallback');
    });

    it('should find node object in SOP spec', () => {
      const node = findNodeInSop('lookup_order', 'main', sampleSopSpec);
      expect(node).toBeDefined();
      expect(node.id).toBe('lookup_order');
      expect(node.actions).toHaveLength(1);
    });
  });
});
