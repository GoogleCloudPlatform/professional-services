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
import YAML from 'yaml';
import crypto from 'crypto';
import { sanitizeResourceId, getEnterNodeToolName } from './utils';

export interface JourneyStep {
  user_says?: string;
  agent_says?: string;
  notes?: string;
  current_flow?: string;
  current_node?: string;
  intermediate_nodes?: string[];
  mock_journey?: string;
}

export interface Journey {
  name: string;
  steps: JourneyStep[];
}

export interface EvaluationStep {
  userInput?: {
    text?: string;
    variables?: Record<string, string>;
    event?: {
      event: string;
    };
  };
  expectation?: {
    agentTransfer?: {
      targetAgent: string;
    };
    toolCall?: {
      id: string;
      tool: string;
      args: Record<string, unknown>;
    };
    toolResponse?: {
      id: string;
      tool: string;
      response: {
        result: Record<string, unknown>;
      };
    };
    agentResponse?: {
      role: string;
      chunks: Array<{ text: string }>;
    };
  };
}

export interface EvaluationTurn {
  steps: EvaluationStep[];
}

export interface EvaluationJson {
  name: string;
  displayName: string;
  golden: {
    turns: EvaluationTurn[];
  };
}

export interface ScenarioEvaluationJson {
  name: string;
  displayName: string;
  scenario: {
    task: string;
    maxTurns: number;
    variableOverrides: Record<string, unknown>;
    taskCompletionBehavior: string;
    userGoalBehavior: string;
  };
}

export function findMainFlowDetails(folderPath: string, files: string[]): { mainFlowId: string; rootNodeId: string } {
  let mainFlowId = '';
  let rootNodeId = '';

  for (const file of files) {
    if (file === 'main.yml' || file === 'main.yaml') {
      try {
        const fileContent = fs.readFileSync(path.join(folderPath, file), 'utf-8');
        const parsed = YAML.parse(fileContent);
        const flow = parsed?.flow;
        if (flow) {
          mainFlowId = flow.id || file.replace(/\.[^/.]+$/, "");
          rootNodeId = flow.root_node_id || '';
          break;
        }
      } catch {
        // ignore
      }
    }
  }

  // Fallback if no main.yml/yaml
  if (!mainFlowId) {
    for (const file of files) {
      if (file.endsWith('.yml') || file.endsWith('.yaml')) {
        try {
          const fileContent = fs.readFileSync(path.join(folderPath, file), 'utf-8');
          const parsed = YAML.parse(fileContent);
          const flow = parsed?.flow;
          if (flow) {
            mainFlowId = flow.id || file.replace(/\.[^/.]+$/, "");
            rootNodeId = flow.root_node_id || '';
            break;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return { mainFlowId, rootNodeId };
}

export function normalizeFlowId(flowId?: string): string {
  if (!flowId) return '';
  return flowId.replace(/\.(yaml|yml)$/i, '');
}

export function findFlowIdForNode(nodeId: string, sopSpec: any, defaultFlowId: string): string {
  const flows = sopSpec?.sop?.flows || sopSpec?.flows || {};
  const normDefault = normalizeFlowId(defaultFlowId);

  if (normDefault && flows[normDefault]) {
    const nodes = flows[normDefault].nodes || [];
    if (nodes.some((n: any) => n.id === nodeId)) {
      return normDefault;
    }
  }

  for (const [flowId, flow] of Object.entries(flows)) {
    if (normalizeFlowId(flowId) === normDefault) {
      const nodes = (flow as any).nodes || [];
      if (nodes.some((n: any) => n.id === nodeId)) {
        return normalizeFlowId(flowId);
      }
    }
  }

  for (const [flowId, flow] of Object.entries(flows)) {
    const nodes = (flow as any).nodes || [];
    if (nodes.some((n: any) => n.id === nodeId)) {
      return normalizeFlowId(flowId);
    }
  }

  return normDefault || defaultFlowId;
}

export function findNodeInSop(nodeId: string, flowId: string, sopSpec: any): any {
  const flows = sopSpec?.sop?.flows || sopSpec?.flows || {};
  const normFlowId = normalizeFlowId(flowId);
  for (const [fid, flow] of Object.entries(flows)) {
    if (normalizeFlowId(fid) === normFlowId) {
      const nodes = (flow as any).nodes || [];
      const found = nodes.find((n: any) => n.id === nodeId);
      if (found) return found;
    }
  }
  return null;
}

export function buildScenarioEvaluationJson(journey: Journey, displayName: string): ScenarioEvaluationJson {
  const steps = journey.steps || [];
  
  // count turns for maxTurns limit
  const userTurnsCount = steps.filter(s => s.user_says).length;
  const maxTurns = Math.max(10, userTurnsCount + 5);

  let task = 'Try to replicate the following conversation; be faithful to the script, try to execute the conversation turns one by one as they are written unless it\'s needed to make a change to achieve the purpose of the conversation, or to abide to the user persona you are given in case you are given one.\n\nThis is the conversation to replicate:\n\n';

  steps.forEach((step) => {
    if (step.agent_says) {
      task += `agent_says: "${step.agent_says}"\n`;
    }
    if (step.user_says) {
      task += `user_says: "${step.user_says}"\n`;
    }
  });

  task += '\n\nWhen you evaluate the conversation, only take into account whether the goal of the conversation itself was reached or not, regardless of how similar the conversation is to the example one.';

  const mockJourneyStep = steps.find(s => s.mock_journey);
  const mockJourneyValue = mockJourneyStep && mockJourneyStep.mock_journey ? mockJourneyStep.mock_journey : 'default';

  return {
    name: crypto.randomUUID(),
    displayName,
    scenario: {
      task,
      maxTurns,
      variableOverrides: {
        ui__mock_journey: mockJourneyValue
      },
      taskCompletionBehavior: 'TASK_SATISFIED',
      userGoalBehavior: 'USER_GOAL_SATISFIED'
    }
  };
}

export interface NodeRef {
  flow_id: string;
  node_id: string;
}

export function analyzeTransition(
  source: NodeRef,
  target: NodeRef,
  sopSpec: any
): { hasIntent: boolean; hasCondition: boolean } {
  let hasIntent = false;
  let hasCondition = false;

  const flows = sopSpec?.sop?.flows || sopSpec?.flows || {};
  const sourceFlow = flows[source.flow_id];
  if (!sourceFlow) {
    return { hasIntent, hasCondition };
  }

  const sourceNode = (sourceFlow.nodes || []).find((n: any) => n.id === source.node_id);

  const normalizeFlowId = (f?: string) => {
    if (!f) return '';
    return f.replace(/\.(yaml|yml)$/i, '').toLowerCase();
  };

  const matches = (routeTargetNode?: string, routeTargetFlow?: string) => {
    let resolvedFlow = source.flow_id;
    if (routeTargetFlow) {
      const normRouteFlow = normalizeFlowId(routeTargetFlow);
      for (const fid of Object.keys(flows)) {
        if (normalizeFlowId(fid) === normRouteFlow) {
          resolvedFlow = fid;
          break;
        }
      }
    }

    let resolvedNode = routeTargetNode;
    if (!resolvedNode && resolvedFlow && flows[resolvedFlow]) {
      resolvedNode = flows[resolvedFlow].root_node_id || '';
    }

    return (
      resolvedFlow.toLowerCase() === target.flow_id.toLowerCase() &&
      Boolean(resolvedNode) &&
      resolvedNode!.toLowerCase() === target.node_id.toLowerCase()
    );
  };

  if (sourceNode) {
    // 1. Check local condition routes
    if (Array.isArray(sourceNode.condition_routes)) {
      for (const route of sourceNode.condition_routes) {
        if (matches(route.target_node, route.target_flow)) {
          hasCondition = true;
          break;
        }
      }
    }

    // 2. Check local intent routes
    if (Array.isArray(sourceNode.intent_routes)) {
      for (const route of sourceNode.intent_routes) {
        if (matches(route.target_node, route.target_flow)) {
          hasIntent = true;
          break;
        }
      }
    }
  }

  // 3. Check global intent routes in current flow
  if (Array.isArray(sourceFlow.global_intent_routes)) {
    for (const route of sourceFlow.global_intent_routes) {
      if (matches(route.target_node, route.target_flow)) {
        hasIntent = true;
        break;
      }
    }
  }

  // 4. Check global intent routes in main flow (if source is not main flow)
  const mainFlowEntry = Object.entries(flows).find(([fid]) => fid.toLowerCase().includes('main'));
  if (mainFlowEntry) {
    const [mainFid, mainFlow] = mainFlowEntry;
    if (mainFid !== source.flow_id && Array.isArray((mainFlow as any).global_intent_routes)) {
      for (const route of (mainFlow as any).global_intent_routes) {
        if (matches(route.target_node, route.target_flow)) {
          hasIntent = true;
          break;
        }
      }
    }
  }

  return { hasIntent, hasCondition };
}

function addEnterNodeExpectation(turnSteps: EvaluationStep[], p: { node_id: string; flow_id: string }) {
  const uuid = crypto.randomUUID();
  turnSteps.push({
    expectation: {
      toolCall: {
        id: uuid,
        tool: 'enter_node',
        args: {
          node_id: p.node_id,
          flow_id: p.flow_id,
          set_variables: {}
        }
      }
    }
  });

  turnSteps.push({
    expectation: {
      toolResponse: {
        id: uuid,
        tool: 'enter_node',
        response: {
          result: {
            status: 'success'
          }
        }
      }
    }
  });
}

function addMultiAgentEnterNodeExpectation(
  turnSteps: EvaluationStep[],
  p: { node_id: string; flow_id: string }
) {
  const enterNodeTool = getEnterNodeToolName(p.flow_id);
  const uuid = crypto.randomUUID();
  turnSteps.push({
    expectation: {
      toolCall: {
        id: uuid,
        tool: enterNodeTool,
        args: {
          node_id: p.node_id,
          set_variables: {}
        }
      }
    }
  });

  turnSteps.push({
    expectation: {
      toolResponse: {
        id: uuid,
        tool: enterNodeTool,
        response: {
          result: {
            status: 'success'
          }
        }
      }
    }
  });
}

function addEndSessionExpectation(turnSteps: EvaluationStep[]) {
  const uuid = crypto.randomUUID();
  turnSteps.push({
    expectation: {
      toolCall: {
        id: uuid,
        tool: 'end_session',
        args: {}
      }
    }
  });

  turnSteps.push({
    expectation: {
      toolResponse: {
        id: uuid,
        tool: 'end_session',
        response: {
          result: {}
        }
      }
    }
  });
}

export function buildGraphGuidedEvaluationJson(
  journey: Journey,
  sopSpec: any,
  mainFlowId: string,
  displayName: string
): EvaluationJson & { warnings: string[] } {
  const warnings: string[] = [];
  const steps = journey.steps || [];
  if (steps.length === 0) {
    return {
      name: crypto.randomUUID(),
      displayName,
      golden: { turns: [] },
      warnings
    };
  }

  // Group steps into turns based on presence of user_says
  const turnGroups: JourneyStep[][] = [];
  let currentTurnSteps: JourneyStep[] = [];

  steps.forEach((step: JourneyStep) => {
    if (step.user_says) {
      if (currentTurnSteps.length > 0) {
        turnGroups.push(currentTurnSteps);
      }
      currentTurnSteps = [step];
    } else {
      currentTurnSteps.push(step);
    }
  });
  if (currentTurnSteps.length > 0) {
    turnGroups.push(currentTurnSteps);
  }

  const turns: EvaluationTurn[] = [];

  let activeMockJourney = 'default';
  const firstMockStep = steps.find(s => s.mock_journey);
  if (firstMockStep && firstMockStep.mock_journey) {
    activeMockJourney = firstMockStep.mock_journey;
  }

  // --- Turn 0: Conversation Start Event Turn ---
  const turn0Steps: EvaluationStep[] = [];
  if (firstMockStep && firstMockStep.mock_journey) {
    turn0Steps.push({
      userInput: {
        variables: {
          ui__mock_journey: activeMockJourney
        }
      }
    });
  }

  turn0Steps.push({
    userInput: {
      event: {
        event: 'conversation-start'
      }
    }
  });

  turn0Steps.push({
    expectation: {
      agentTransfer: {
        targetAgent: 'flow_agent'
      }
    }
  });

  // Calculate nodes for Turn 0 (starting nodes from step 0)
  const path0: Array<{ node_id: string; flow_id: string }> = [];
  let runningFlowId = normalizeFlowId(steps[0].current_flow) || mainFlowId;

  if (steps[0].current_node) {
    const resolvedFlowId = findFlowIdForNode(steps[0].current_node, sopSpec, runningFlowId);
    runningFlowId = resolvedFlowId;
    path0.push({ node_id: steps[0].current_node, flow_id: runningFlowId });
  }

  if (steps[0].intermediate_nodes && Array.isArray(steps[0].intermediate_nodes)) {
    steps[0].intermediate_nodes.forEach((intNode: string) => {
      const resolvedFlowId = findFlowIdForNode(intNode, sopSpec, runningFlowId);
      runningFlowId = resolvedFlowId;
      path0.push({ node_id: intNode, flow_id: runningFlowId });
    });
  }

  const expectedCalls0: Array<{ node_id: string; flow_id: string }> = [];
  path0.forEach(p => {
    if (expectedCalls0.length === 0) {
      expectedCalls0.push(p);
    } else {
      const last = expectedCalls0[expectedCalls0.length - 1];
      if (last.node_id !== p.node_id || last.flow_id !== p.flow_id) {
        expectedCalls0.push(p);
      }
    }
  });

  let lastActiveNode: { node_id: string; flow_id: string } | null = null;

  expectedCalls0.forEach((p, idx) => {
    if (idx === 0 || !lastActiveNode) {
      addEnterNodeExpectation(turn0Steps, p);
      lastActiveNode = p;
    } else {
      const { hasIntent, hasCondition } = analyzeTransition(lastActiveNode, p, sopSpec);
      if (hasCondition && !hasIntent) {
        // Pure condition route: runtime automatically traverses, no enter_node expectation needed
      } else if (hasIntent && hasCondition) {
        addEnterNodeExpectation(turn0Steps, p);
        warnings.push(
          `Nodes '${lastActiveNode.node_id}' and '${p.node_id}' in flow '${p.flow_id}' are connected by BOTH intent and condition routes. Ambiguous turn execution: enter_node assertion was included in golden evaluation for journey '${journey.name}'.`
        );
      } else {
        addEnterNodeExpectation(turn0Steps, p);
      }
      lastActiveNode = p;
    }
    if (p.node_id === 'END' || p.node_id?.toUpperCase() === 'END') {
      addEndSessionExpectation(turn0Steps);
    }
  });

  // Initial agent response from steps[0].agent_says
  const initialAgentSays = steps[0].agent_says ? steps[0].agent_says.trim() : '';
  if (initialAgentSays) {
    turn0Steps.push({
      expectation: {
        agentResponse: {
          role: 'agent',
          chunks: [{ text: initialAgentSays }]
        }
      }
    });
  }

  turns.push({ steps: turn0Steps });

  // --- Subsequent Turns (User Turns) ---
  for (let i = 0; i < turnGroups.length; i++) {
    const currentGroup = turnGroups[i];
    const stepStart = currentGroup[0];

    if (!stepStart.user_says) continue;

    const turnSteps: EvaluationStep[] = [];

    const mockJourneyStep = currentGroup.find(s => s.mock_journey);
    if (mockJourneyStep && mockJourneyStep.mock_journey && mockJourneyStep.mock_journey !== activeMockJourney) {
      activeMockJourney = mockJourneyStep.mock_journey;
      turnSteps.push({
        userInput: {
          variables: {
            ui__mock_journey: activeMockJourney
          }
        }
      });
    }

    turnSteps.push({
      userInput: {
        text: stepStart.user_says
      }
    });

    const nextGroup = turnGroups[i + 1];
    const nextStep = nextGroup ? nextGroup[0] : null;

    const path: Array<{ node_id: string; flow_id: string }> = [];

    for (let k = 1; k < currentGroup.length; k++) {
      const s = currentGroup[k];
      if (s.intermediate_nodes && Array.isArray(s.intermediate_nodes)) {
        s.intermediate_nodes.forEach((intNode: string) => {
          const resolvedFlowId = findFlowIdForNode(intNode, sopSpec, runningFlowId);
          runningFlowId = resolvedFlowId;
          path.push({ node_id: intNode, flow_id: runningFlowId });
        });
      }
      if (s.current_node) {
        const resolvedFlowId = s.current_flow ? normalizeFlowId(s.current_flow) : findFlowIdForNode(s.current_node, sopSpec, runningFlowId);
        runningFlowId = resolvedFlowId;
        path.push({ node_id: s.current_node, flow_id: runningFlowId });
      }
    }

    if (nextStep) {
      if (nextStep.intermediate_nodes && Array.isArray(nextStep.intermediate_nodes)) {
        nextStep.intermediate_nodes.forEach((intNode: string) => {
          const resolvedFlowId = findFlowIdForNode(intNode, sopSpec, runningFlowId);
          runningFlowId = resolvedFlowId;
          path.push({ node_id: intNode, flow_id: runningFlowId });
        });
      }
      if (nextStep.current_node) {
        const resolvedFlowId = nextStep.current_flow ? normalizeFlowId(nextStep.current_flow) : findFlowIdForNode(nextStep.current_node, sopSpec, runningFlowId);
        runningFlowId = resolvedFlowId;
        path.push({ node_id: nextStep.current_node, flow_id: runningFlowId });
      }
    }

    const expectedCalls: Array<{ node_id: string; flow_id: string }> = [];
    path.forEach(p => {
      if (expectedCalls.length === 0) {
        expectedCalls.push(p);
      } else {
        const last = expectedCalls[expectedCalls.length - 1];
        if (last.node_id !== p.node_id || last.flow_id !== p.flow_id) {
          expectedCalls.push(p);
        }
      }
    });

    expectedCalls.forEach((p) => {
      if (!lastActiveNode) {
        addEnterNodeExpectation(turnSteps, p);
        lastActiveNode = p;
      } else {
        const { hasIntent, hasCondition } = analyzeTransition(lastActiveNode, p, sopSpec);
        if (hasCondition && !hasIntent) {
          // Pure condition route: runtime automatically traverses, no enter_node expectation needed
          lastActiveNode = p;
        } else if (hasIntent && hasCondition) {
          addEnterNodeExpectation(turnSteps, p);
          warnings.push(
            `Nodes '${lastActiveNode.node_id}' and '${p.node_id}' in flow '${p.flow_id}' are connected by BOTH intent and condition routes. Ambiguous turn execution: enter_node assertion was included in golden evaluation for journey '${journey.name}'.`
          );
          lastActiveNode = p;
        } else if (hasIntent) {
          // Pure intent route (including self-loop intent routes): LLM calls enter_node for p.
          addEnterNodeExpectation(turnSteps, p);
          lastActiveNode = p;
        } else if (lastActiveNode.node_id === p.node_id && lastActiveNode.flow_id === p.flow_id) {
          // Same node and no intent/condition self-loop route: skip
        } else {
          // Unlinked transition to a different node: default to adding enter_node expectation
          addEnterNodeExpectation(turnSteps, p);
          lastActiveNode = p;
        }
      }
      if (p.node_id === 'END' || p.node_id?.toUpperCase() === 'END') {
        addEndSessionExpectation(turnSteps);
      }
    });

    const agentMessages: string[] = [];
    for (let k = 1; k < currentGroup.length; k++) {
      if (currentGroup[k].agent_says) {
        agentMessages.push(currentGroup[k].agent_says!);
      }
    }
    if (nextGroup && nextGroup[0] && nextGroup[0].agent_says) {
      agentMessages.push(nextGroup[0].agent_says!);
    }

    const expectedResponseText = agentMessages.filter(Boolean).map(m => m.trim()).join(' ');
    if (expectedResponseText) {
      turnSteps.push({
        expectation: {
          agentResponse: {
            role: 'agent',
            chunks: [{
              text: expectedResponseText
            }]
          }
        }
      });
    }

    turns.push({
      steps: turnSteps
    });
  }

  return {
    name: crypto.randomUUID(),
    displayName,
    golden: {
      turns
    },
    warnings
  };
}

export function buildMultiAgentGraphGuidedEvaluationJson(
  journey: Journey,
  sopSpec: any,
  mainFlowId: string,
  displayName: string,
  _flowIdToAgentMap: Record<string, string> = {}
): EvaluationJson & { warnings: string[] } {
  const warnings: string[] = [];
  const steps = journey.steps || [];
  if (steps.length === 0) {
    return {
      name: crypto.randomUUID(),
      displayName,
      golden: { turns: [] },
      warnings
    };
  }

  // Group steps into turns based on presence of user_says
  const turnGroups: JourneyStep[][] = [];
  let currentTurnSteps: JourneyStep[] = [];

  steps.forEach((step: JourneyStep) => {
    if (step.user_says) {
      if (currentTurnSteps.length > 0) {
        turnGroups.push(currentTurnSteps);
      }
      currentTurnSteps = [step];
    } else {
      currentTurnSteps.push(step);
    }
  });
  if (currentTurnSteps.length > 0) {
    turnGroups.push(currentTurnSteps);
  }

  const turns: EvaluationTurn[] = [];

  let activeMockJourney = 'default';
  const firstMockStep = steps.find(s => s.mock_journey);
  if (firstMockStep && firstMockStep.mock_journey) {
    activeMockJourney = firstMockStep.mock_journey;
  }

  // --- Turn 0: Conversation Start Event Turn ---
  const turn0Steps: EvaluationStep[] = [];
  if (firstMockStep && firstMockStep.mock_journey) {
    turn0Steps.push({
      userInput: {
        variables: {
          ui__mock_journey: activeMockJourney
        }
      }
    });
  }

  turn0Steps.push({
    userInput: {
      event: {
        event: 'conversation-start'
      }
    }
  });

  // Calculate nodes for Turn 0 (starting nodes from step 0)
  const path0: Array<{ node_id: string; flow_id: string }> = [];
  let runningFlowId = normalizeFlowId(steps[0].current_flow) || mainFlowId;

  if (steps[0].current_node) {
    const resolvedFlowId = findFlowIdForNode(steps[0].current_node, sopSpec, runningFlowId);
    runningFlowId = resolvedFlowId;
    path0.push({ node_id: steps[0].current_node, flow_id: runningFlowId });
  }

  if (steps[0].intermediate_nodes && Array.isArray(steps[0].intermediate_nodes)) {
    steps[0].intermediate_nodes.forEach((intNode: string) => {
      const resolvedFlowId = findFlowIdForNode(intNode, sopSpec, runningFlowId);
      runningFlowId = resolvedFlowId;
      path0.push({ node_id: intNode, flow_id: runningFlowId });
    });
  }

  const expectedCalls0: Array<{ node_id: string; flow_id: string }> = [];
  path0.forEach(p => {
    if (expectedCalls0.length === 0) {
      expectedCalls0.push(p);
    } else {
      const last = expectedCalls0[expectedCalls0.length - 1];
      if (last.node_id !== p.node_id || last.flow_id !== p.flow_id) {
        expectedCalls0.push(p);
      }
    }
  });

  let lastActiveNode: { node_id: string; flow_id: string } | null = null;

  expectedCalls0.forEach((p, idx) => {
    if (idx === 0 || !lastActiveNode) {
      addMultiAgentEnterNodeExpectation(turn0Steps, p);
      lastActiveNode = p;
    } else {
      const { hasIntent, hasCondition } = analyzeTransition(lastActiveNode, p, sopSpec);
      if (hasCondition && !hasIntent) {
        // Pure condition route: runtime automatically traverses, no enter_node expectation needed
      } else if (hasIntent && hasCondition) {
        addMultiAgentEnterNodeExpectation(turn0Steps, p);
        warnings.push(
          `Nodes '${lastActiveNode.node_id}' and '${p.node_id}' in flow '${p.flow_id}' are connected by BOTH intent and condition routes. Ambiguous turn execution: enter_node assertion was included in golden evaluation for journey '${journey.name}'.`
        );
      } else {
        addMultiAgentEnterNodeExpectation(turn0Steps, p);
      }
      lastActiveNode = p;
    }
    if (p.node_id === 'END' || p.node_id?.toUpperCase() === 'END') {
      addEndSessionExpectation(turn0Steps);
    }
  });

  // Initial agent response from steps[0].agent_says
  const initialAgentSays = steps[0].agent_says ? steps[0].agent_says.trim() : '';
  if (initialAgentSays) {
    turn0Steps.push({
      expectation: {
        agentResponse: {
          role: 'agent',
          chunks: [{ text: initialAgentSays }]
        }
      }
    });
  }

  turns.push({ steps: turn0Steps });

  // --- Subsequent Turns (User Turns) ---
  for (let i = 0; i < turnGroups.length; i++) {
    const currentGroup = turnGroups[i];
    const stepStart = currentGroup[0];

    if (!stepStart.user_says) continue;

    const turnSteps: EvaluationStep[] = [];

    const mockJourneyStep = currentGroup.find(s => s.mock_journey);
    if (mockJourneyStep && mockJourneyStep.mock_journey && mockJourneyStep.mock_journey !== activeMockJourney) {
      activeMockJourney = mockJourneyStep.mock_journey;
      turnSteps.push({
        userInput: {
          variables: {
            ui__mock_journey: activeMockJourney
          }
        }
      });
    }

    turnSteps.push({
      userInput: {
        text: stepStart.user_says
      }
    });

    const nextGroup = turnGroups[i + 1];
    const nextStep = nextGroup ? nextGroup[0] : null;

    const path: Array<{ node_id: string; flow_id: string }> = [];

    for (let k = 1; k < currentGroup.length; k++) {
      const s = currentGroup[k];
      if (s.intermediate_nodes && Array.isArray(s.intermediate_nodes)) {
        s.intermediate_nodes.forEach((intNode: string) => {
          const resolvedFlowId = findFlowIdForNode(intNode, sopSpec, runningFlowId);
          runningFlowId = resolvedFlowId;
          path.push({ node_id: intNode, flow_id: runningFlowId });
        });
      }
      if (s.current_node) {
        const resolvedFlowId = s.current_flow ? normalizeFlowId(s.current_flow) : findFlowIdForNode(s.current_node, sopSpec, runningFlowId);
        runningFlowId = resolvedFlowId;
        path.push({ node_id: s.current_node, flow_id: runningFlowId });
      }
    }

    if (nextStep) {
      if (nextStep.intermediate_nodes && Array.isArray(nextStep.intermediate_nodes)) {
        nextStep.intermediate_nodes.forEach((intNode: string) => {
          const resolvedFlowId = findFlowIdForNode(intNode, sopSpec, runningFlowId);
          runningFlowId = resolvedFlowId;
          path.push({ node_id: intNode, flow_id: runningFlowId });
        });
      }
      if (nextStep.current_node) {
        const resolvedFlowId = nextStep.current_flow ? normalizeFlowId(nextStep.current_flow) : findFlowIdForNode(nextStep.current_node, sopSpec, runningFlowId);
        runningFlowId = resolvedFlowId;
        path.push({ node_id: nextStep.current_node, flow_id: runningFlowId });
      }
    }

    const expectedCalls: Array<{ node_id: string; flow_id: string }> = [];
    path.forEach(p => {
      if (expectedCalls.length === 0) {
        expectedCalls.push(p);
      } else {
        const last = expectedCalls[expectedCalls.length - 1];
        if (last.node_id !== p.node_id || last.flow_id !== p.flow_id) {
          expectedCalls.push(p);
        }
      }
    });

    expectedCalls.forEach((p) => {
      if (!lastActiveNode) {
        addMultiAgentEnterNodeExpectation(turnSteps, p);
        lastActiveNode = p;
      } else {
        const { hasIntent, hasCondition } = analyzeTransition(lastActiveNode, p, sopSpec);
        if (hasCondition && !hasIntent) {
          // Pure condition route: runtime automatically traverses, no enter_node expectation needed
          lastActiveNode = p;
        } else if (hasIntent && hasCondition) {
          addMultiAgentEnterNodeExpectation(turnSteps, p);
          warnings.push(
            `Nodes '${lastActiveNode.node_id}' and '${p.node_id}' in flow '${p.flow_id}' are connected by BOTH intent and condition routes. Ambiguous turn execution: enter_node assertion was included in golden evaluation for journey '${journey.name}'.`
          );
          lastActiveNode = p;
        } else if (hasIntent) {
          // Pure intent route (including self-loop intent routes): LLM calls enter_node for p.
          addMultiAgentEnterNodeExpectation(turnSteps, p);
          lastActiveNode = p;
        } else if (lastActiveNode.node_id === p.node_id && lastActiveNode.flow_id === p.flow_id) {
          // Same node and no intent/condition self-loop route: skip
        } else {
          // Unlinked transition to a different node: default to adding enter_node expectation
          addMultiAgentEnterNodeExpectation(turnSteps, p);
          lastActiveNode = p;
        }
      }
      if (p.node_id === 'END' || p.node_id?.toUpperCase() === 'END') {
        addEndSessionExpectation(turnSteps);
      }
    });

    const agentMessages: string[] = [];
    for (let k = 1; k < currentGroup.length; k++) {
      if (currentGroup[k].agent_says) {
        agentMessages.push(currentGroup[k].agent_says!);
      }
    }
    if (nextGroup && nextGroup[0] && nextGroup[0].agent_says) {
      agentMessages.push(nextGroup[0].agent_says!);
    }

    const expectedResponseText = agentMessages.filter(Boolean).map(m => m.trim()).join(' ');
    if (expectedResponseText) {
      turnSteps.push({
        expectation: {
          agentResponse: {
            role: 'agent',
            chunks: [{
              text: expectedResponseText
            }]
          }
        }
      });
    }

    turns.push({
      steps: turnSteps
    });
  }

  return {
    name: crypto.randomUUID(),
    displayName,
    golden: {
      turns
    },
    warnings
  };
}

export function buildFullyAgenticEvaluationJson(
  journey: Journey,
  sopSpec: any,
  mainFlowId: string,
  displayName: string
): EvaluationJson {
  const steps = journey.steps || [];
  if (steps.length === 0) {
    return {
      name: crypto.randomUUID(),
      displayName,
      golden: { turns: [] }
    };
  }

  // Group steps into turns based on presence of user_says
  const turnGroups: JourneyStep[][] = [];
  let currentTurnSteps: JourneyStep[] = [];

  steps.forEach((step: JourneyStep) => {
    if (step.user_says) {
      if (currentTurnSteps.length > 0) {
        turnGroups.push(currentTurnSteps);
      }
      currentTurnSteps = [step];
    } else {
      currentTurnSteps.push(step);
    }
  });
  if (currentTurnSteps.length > 0) {
    turnGroups.push(currentTurnSteps);
  }

  const turns: EvaluationTurn[] = [];
  let currentFlowId = 'main';
  let activeMockJourney = 'default';
  const firstMockStep = steps.find(s => s.mock_journey);
  if (firstMockStep && firstMockStep.mock_journey) {
    activeMockJourney = firstMockStep.mock_journey;
  }

  // --- Turn 0: Conversation Start Event Turn ---
  const turn0Steps: EvaluationStep[] = [];
  if (firstMockStep && firstMockStep.mock_journey) {
    turn0Steps.push({
      userInput: {
        variables: {
          ui__mock_journey: activeMockJourney
        }
      }
    });
  }

  turn0Steps.push({
    userInput: {
      event: {
        event: 'conversation-start'
      }
    }
  });

  const path0: Array<{ node_id: string; flow_id: string }> = [];
  let runningFlowId = normalizeFlowId(steps[0].current_flow) || mainFlowId;

  if (steps[0].current_node) {
    const resolvedFlowId = findFlowIdForNode(steps[0].current_node, sopSpec, runningFlowId);
    runningFlowId = resolvedFlowId;
    path0.push({ node_id: steps[0].current_node, flow_id: runningFlowId });
  }

  if (steps[0].intermediate_nodes && Array.isArray(steps[0].intermediate_nodes)) {
    steps[0].intermediate_nodes.forEach((intNode: string) => {
      const resolvedFlowId = findFlowIdForNode(intNode, sopSpec, runningFlowId);
      runningFlowId = resolvedFlowId;
      path0.push({ node_id: intNode, flow_id: runningFlowId });
    });
  }

  const uniquePath0: Array<{ node_id: string; flow_id: string }> = [];
  path0.forEach(p => {
    if (uniquePath0.length === 0) {
      uniquePath0.push(p);
    } else {
      const last = uniquePath0[uniquePath0.length - 1];
      if (last.node_id !== p.node_id || last.flow_id !== p.flow_id) {
        uniquePath0.push(p);
      }
    }
  });

  uniquePath0.forEach((p) => {
    const isTargetMain = p.flow_id.toLowerCase() === 'main' || p.flow_id.toLowerCase() === mainFlowId.toLowerCase();
    const targetAgent = isTargetMain ? 'main' : sanitizeResourceId(p.flow_id.toLowerCase());
    if (targetAgent !== currentFlowId) {
      turn0Steps.push({
        expectation: {
          agentTransfer: {
            targetAgent
          }
        }
      });
      currentFlowId = targetAgent;
    }

    const nodeObj = findNodeInSop(p.node_id, p.flow_id, sopSpec);
    if (nodeObj && nodeObj.actions && Array.isArray(nodeObj.actions)) {
      nodeObj.actions.forEach((act: any) => {
        if (act.type === 'tool' && act.tool_name) {
          const toolName = sanitizeResourceId(act.tool_name.toLowerCase());
          const uuid = crypto.randomUUID();
          const mockResponses = act.mock_responses || {};
          const mockResult = mockResponses[activeMockJourney] || mockResponses['default'] || {};

          turn0Steps.push({
            expectation: {
              toolCall: {
                id: uuid,
                tool: toolName,
                args: {}
              }
            }
          });

          turn0Steps.push({
            expectation: {
              toolResponse: {
                id: uuid,
                tool: toolName,
                response: {
                  result: mockResult
                }
              }
            }
          });
        }
      });
    }
    if (p.node_id === 'END' || p.node_id?.toUpperCase() === 'END') {
      addEndSessionExpectation(turn0Steps);
    }
  });

  const initialAgentSays = steps[0].agent_says ? steps[0].agent_says.trim() : '';
  if (initialAgentSays) {
    turn0Steps.push({
      expectation: {
        agentResponse: {
          role: 'agent',
          chunks: [{ text: initialAgentSays }]
        }
      }
    });
  }

  turns.push({ steps: turn0Steps });

  // --- Subsequent Turns (User Turns) ---
  for (let i = 0; i < turnGroups.length; i++) {
    const currentGroup = turnGroups[i];
    const stepStart = currentGroup[0];

    if (!stepStart.user_says) continue;

    const turnSteps: EvaluationStep[] = [];

    const mockJourneyStep = currentGroup.find(s => s.mock_journey);
    if (mockJourneyStep && mockJourneyStep.mock_journey && mockJourneyStep.mock_journey !== activeMockJourney) {
      activeMockJourney = mockJourneyStep.mock_journey;
      turnSteps.push({
        userInput: {
          variables: {
            ui__mock_journey: activeMockJourney
          }
        }
      });
    }

    turnSteps.push({
      userInput: {
        text: stepStart.user_says
      }
    });

    const nextGroup = turnGroups[i + 1];
    const nextStep = nextGroup ? nextGroup[0] : null;

    const path: Array<{ node_id: string; flow_id: string }> = [];

    for (let k = 1; k < currentGroup.length; k++) {
      const s = currentGroup[k];
      if (s.intermediate_nodes && Array.isArray(s.intermediate_nodes)) {
        s.intermediate_nodes.forEach((intNode: string) => {
          const resolvedFlowId = findFlowIdForNode(intNode, sopSpec, runningFlowId);
          runningFlowId = resolvedFlowId;
          path.push({ node_id: intNode, flow_id: runningFlowId });
        });
      }
      if (s.current_node) {
        const resolvedFlowId = s.current_flow ? normalizeFlowId(s.current_flow) : findFlowIdForNode(s.current_node, sopSpec, runningFlowId);
        runningFlowId = resolvedFlowId;
        path.push({ node_id: s.current_node, flow_id: runningFlowId });
      }
    }

    if (nextStep) {
      if (nextStep.intermediate_nodes && Array.isArray(nextStep.intermediate_nodes)) {
        nextStep.intermediate_nodes.forEach((intNode: string) => {
          const resolvedFlowId = findFlowIdForNode(intNode, sopSpec, runningFlowId);
          runningFlowId = resolvedFlowId;
          path.push({ node_id: intNode, flow_id: runningFlowId });
        });
      }
      if (nextStep.current_node) {
        const resolvedFlowId = nextStep.current_flow ? normalizeFlowId(nextStep.current_flow) : findFlowIdForNode(nextStep.current_node, sopSpec, runningFlowId);
        runningFlowId = resolvedFlowId;
        path.push({ node_id: nextStep.current_node, flow_id: runningFlowId });
      }
    }

    const uniquePath: Array<{ node_id: string; flow_id: string }> = [];
    path.forEach(p => {
      if (uniquePath.length === 0) {
        uniquePath.push(p);
      } else {
        const last = uniquePath[uniquePath.length - 1];
        if (last.node_id !== p.node_id || last.flow_id !== p.flow_id) {
          uniquePath.push(p);
        }
      }
    });

    uniquePath.forEach((p) => {
      const isTargetMain = p.flow_id.toLowerCase() === 'main' || p.flow_id.toLowerCase() === mainFlowId.toLowerCase();
      const targetAgent = isTargetMain ? 'main' : sanitizeResourceId(p.flow_id.toLowerCase());
      if (targetAgent !== currentFlowId) {
        turnSteps.push({
          expectation: {
            agentTransfer: {
              targetAgent
            }
          }
        });
        currentFlowId = targetAgent;
      }

      const nodeObj = findNodeInSop(p.node_id, p.flow_id, sopSpec);
      if (nodeObj && nodeObj.actions && Array.isArray(nodeObj.actions)) {
        nodeObj.actions.forEach((act: any) => {
          if (act.type === 'tool' && act.tool_name) {
            const toolName = sanitizeResourceId(act.tool_name.toLowerCase());
            const uuid = crypto.randomUUID();
            const mockResponses = act.mock_responses || {};
            const mockResult = mockResponses[activeMockJourney] || mockResponses['default'] || {};

            turnSteps.push({
              expectation: {
                toolCall: {
                  id: uuid,
                  tool: toolName,
                  args: {}
                }
              }
            });

            turnSteps.push({
              expectation: {
                toolResponse: {
                  id: uuid,
                  tool: toolName,
                  response: {
                    result: mockResult
                  }
                }
              }
            });
          }
        });
      }
      if (p.node_id === 'END' || p.node_id?.toUpperCase() === 'END') {
        addEndSessionExpectation(turnSteps);
      }
    });

    const agentMessages: string[] = [];
    for (let k = 1; k < currentGroup.length; k++) {
      if (currentGroup[k].agent_says) {
        agentMessages.push(currentGroup[k].agent_says!);
      }
    }
    if (nextGroup && nextGroup[0] && nextGroup[0].agent_says) {
      agentMessages.push(nextGroup[0].agent_says!);
    }

    const expectedResponseText = agentMessages.filter(Boolean).map(m => m.trim()).join(' ');
    if (expectedResponseText) {
      turnSteps.push({
        expectation: {
          agentResponse: {
            role: 'agent',
            chunks: [{
              text: expectedResponseText
            }]
          }
        }
      });
    }

    turns.push({
      steps: turnSteps
    });
  }

  return {
    name: crypto.randomUUID(),
    displayName,
    golden: {
      turns
    }
  };
}
