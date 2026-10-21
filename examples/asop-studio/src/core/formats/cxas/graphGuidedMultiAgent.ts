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
import type { CxasExportContext } from './types';
import { generateTools } from './tools';
import { buildUnifiedSop, formatProjectName, optimizeSopForRuntime, getAssetsPath } from '../utils';
import { formatAsPythonDict } from '../pythonSerializer';
import { sanitizeResourceId, getEnterNodeToolName } from './utils';
import { GUARDRAIL_ID, GUARDRAIL_DISPLAY_NAME, GUARDRAIL_DIR_NAME } from './constants';
import {
  buildMultiAgentGraphGuidedEvaluationJson,
  buildScenarioEvaluationJson,
  findMainFlowDetails
} from './evaluations';
import { collectTools } from './graphGuidedSingleAgent';

interface FlowMeta {
  flowId: string;
  isMainFlow: boolean;
  agentFolderName: string;
  agentName: string;
  toolPrefix: string;
  enterNodeToolName: string;
  rootNodeId: string;
  flowData: any;
  referencedFlows: Set<string>;
}

const VENDORIZED_ENGINE_PYTHON_CODE = `# ==============================================================================
# VENDORIZED REPEATED ENGINE CODE (enter_node traversal engine)
# The functions below are vendorized in each flow-specific node tool to ensure
# direct local execution, avoiding inter-tool JSON payload serialization overhead
# and preserving sub-tool traceback visibility in the CXAS execution environment.
# ==============================================================================

def get_nested_value(state: dict, path: str) -> Any:
    if not path:
        return None
    if path.startswith("$session.params."):
        path = path[16:]
    if path.startswith('.'):
        path = path[1:]
    
    parts = path.split('.')
    first = parts[0]
    
    val = state.get(first)
    if val is None and f"sop__{first}" in state:
        val = state.get(f"sop__{first}")
        
    for part in parts[1:]:
        if isinstance(val, dict):
            val = val.get(part)
        elif isinstance(val, list):
            try:
                val = val[int(part)]
            except (ValueError, IndexError):
                return None
        else:
            return None
    return val

def evaluate_single_clause(clause: str, state: dict) -> bool:
    clause = clause.strip()
    if not clause:
        return False
    if clause.lower() == "true":
        return True
    if clause.lower() == "false":
        return False

    lower_clause = clause.lower()
    if lower_clause.endswith(" is null"):
        var_name = clause[:-8].strip()
        return get_nested_value(state, var_name) is None

    if lower_clause.endswith(" is not null"):
        var_name = clause[:-12].strip()
        return get_nested_value(state, var_name) is not None

    operators = ["!=", "==", ">=", "<=", ">", "<", "="]
    for op in operators:
        if op in clause:
            parts = clause.split(op, 1)
            left = parts[0].strip()
            right = parts[1].strip()

            left_val = get_nested_value(state, left)

            right_val = None
            if right.lower() == "null":
                right_val = None
            elif right.lower() == "true":
                right_val = True
            elif right.lower() == "false":
                right_val = False
            elif (right.startswith('"') and right.endswith('"')) or (right.startswith("'") and right.endswith("'")):
                right_val = right[1:-1]
            else:
                try:
                    if "." in right:
                        right_val = float(right)
                    else:
                        right_val = int(right)
                except ValueError:
                    right_val = right

            try:
                if op in ["=", "=="]:
                    return left_val == right_val
                elif op == "!=":
                    return left_val != right_val
                elif op == ">":
                    return left_val is not None and right_val is not None and left_val > right_val
                elif op == "<":
                    return left_val is not None and right_val is not None and left_val < right_val
                elif op == ">=":
                    return left_val is not None and right_val is not None and left_val >= right_val
                elif op == "<=":
                    return left_val is not None and right_val is not None and left_val <= right_val
            except Exception:
                return False
    return False

def evaluate_condition(condition: str, state: dict) -> bool:
    if not condition or condition.strip().lower() == "true":
        return True
    
    or_parts = re.split(r'\\s+OR\\s+|\\s+or\\s+', condition)
    for or_part in or_parts:
        and_parts = re.split(r'\\s+AND\\s+|\\s+and\\s+', or_part)
        if all(evaluate_single_clause(and_part, state) for and_part in and_parts):
            return True
    return False

def enter_node_wrapped(
    node_id: Optional[str],
    flow_id: Optional[str],
    set_variables: Dict[str, Any],
    flow_definition: Dict[str, Any],
    main_global_intent_routes: List[Dict[str, Any]],
    flow_to_agent_map: Dict[str, str],
    flow_root_nodes: Dict[str, str]
) -> Dict[str, Any]:
    state = context.state
    
    # 1. Update session state with parameters extracted by LLM
    if set_variables:
        state.update(set_variables)
        for k, v in set_variables.items():
            if not k.startswith("sop__"):
                state[f"sop__{k}"] = v

    current_flow_id = flow_definition.get("id") or state.get("int__current_flow_id", "") or flow_id

    # Initialize input variables if defined on this flow
    input_vars = flow_definition.get("input_variables", [])
    for var in input_vars:
        var_name = var.get("name") if isinstance(var, dict) else var
        default_val = var.get("default") if isinstance(var, dict) else None
        if var_name and var_name not in state:
            state[var_name] = default_val
            state[f"sop__{var_name}"] = default_val

    # 2. Check if this call is an intent transition targeting another flow
    if flow_id and current_flow_id and flow_id != current_flow_id:
        target_agent = flow_to_agent_map.get(flow_id, flow_id)
        target_node = flow_root_nodes.get(flow_id) if (not node_id or node_id == flow_id or node_id == "None") else node_id
        state["int__target_agent_handoff"] = target_agent
        state["int__target_node"] = target_node
        state["int__available_node_ids"] = [{"flow_id": flow_id, "node_id": target_node}] if target_node else []
        return {
            "status": "handoff",
            "handoff_agent": target_agent,
            "target_flow": flow_id,
            "target_node": target_node,
            "instruction": f"Handoff to agent '{target_agent}' for flow '{flow_id}'."
        }

    nodes_lookup = {node["id"]: node for node in flow_definition.get("nodes", [])}
    
    # Check if node_id belongs to another flow or is a target flow ID
    if node_id not in nodes_lookup and node_id != "END":
        available_nodes = state.get("int__available_node_ids", [])
        matched_avail = next((item for item in available_nodes if item.get("node_id") == node_id and item.get("flow_id") != current_flow_id), None)
        if not matched_avail and (node_id in flow_to_agent_map or node_id in flow_root_nodes):
            target_flow = node_id
            target_node = flow_root_nodes.get(target_flow)
            matched_avail = {"flow_id": target_flow, "node_id": target_node}
        if matched_avail:
            target_flow = matched_avail["flow_id"]
            target_node = matched_avail.get("node_id") or flow_root_nodes.get(target_flow)
            target_agent = flow_to_agent_map.get(target_flow, target_flow)
            state["int__target_agent_handoff"] = target_agent
            state["int__target_node"] = target_node
            state["int__available_node_ids"] = [{"flow_id": target_flow, "node_id": target_node}] if target_node else []
            return {
                "status": "handoff",
                "handoff_agent": target_agent,
                "target_flow": target_flow,
                "target_node": target_node,
                "instruction": f"Handoff to agent '{target_agent}' for flow '{target_flow}'."
            }

    # If node_id was omitted, None, or equal to current_flow_id, resolve to current flow's root node
    if not node_id or node_id == current_flow_id or node_id == "None":
        node_id = flow_definition.get("root_node_id")

    # 3. Validate transition
    available_nodes = state.get("int__available_node_ids")
    if available_nodes is None:
        root_node_id = flow_definition.get("root_node_id")
        available_nodes = [{"flow_id": current_flow_id, "node_id": root_node_id}] if root_node_id else []

    target_match = {"flow_id": current_flow_id, "node_id": node_id}
    if available_nodes and target_match not in available_nodes and node_id != flow_definition.get("root_node_id"):
        choices_str = ", ".join([f"(flow: '{item.get('flow_id')}', node: '{item.get('node_id')}')" for item in available_nodes])
        raise ValueError(
            f"Illegal transition to node_id '{node_id}' in flow '{current_flow_id}'. "
            f"The transitions currently available to pick from are: [{choices_str}]. "
            "DO NOT transition to any other node or flow, even if they were mentioned in previous conversation turns."
        )

    accumulated_instructions: List[str] = []
    action_results: Dict[str, Any] = {}
    current_node_id = node_id
    depth = 0
    max_traversal_depth = 10
    handoff_target = None

    # 4. Traversal Loop
    while depth < max_traversal_depth:
        if current_node_id == "END":
            accumulated_instructions.append(
                "The structured flow has ended. 1) Send the last message to the customer. 2) terminate the conversation."
            )
            break

        node = nodes_lookup.get(current_node_id)
        if not node:
            return {
                "status": "error",
                "message": f"Target node '{current_node_id}' not found in flow '{current_flow_id}'.",
                "current_node_id": "END",
                "accumulated_instructions": accumulated_instructions,
                "action_results": action_results,
                "available_intent_transitions": []
            }

        # Append instructions for the current node
        if "agent_instructions" in node:
            accumulated_instructions.append(node["agent_instructions"])

        # Execute actions
        if "actions" in node:
            for action in node["actions"]:
                if action.get("type") == "tool":
                    tool_name = action.get("tool_name")
                    tool_params = action.get("tool_params", {})
                    resolved_params = {
                        k: state.get(v, state.get(f"sop__{v}")) for k, v in tool_params.items()
                    }
                    store_var = action.get("store_result_variable")
                    try:
                        tool_func = getattr(tools, tool_name)
                        res = tool_func(resolved_params)
                        res_json = res.json() if hasattr(res, "json") and callable(res.json) else res
                        action_results[tool_name] = res_json
                        if store_var:
                            val = res_json.get("result") if isinstance(res_json, dict) and "result" in res_json else res_json
                            state[store_var] = val
                            state[f"sop__{store_var}"] = val
                    except Exception as e:
                        action_results[tool_name] = {"status": "error", "error": str(e)}

        transitioned = False

        # Evaluate condition routes
        condition_routes = node.get("condition_routes", [])
        for route in condition_routes:
            if evaluate_condition(route["condition"], state):
                target_flow = route.get("target_flow")
                target_node = route.get("target_node")

                if target_flow and target_flow != current_flow_id:
                    target_agent = flow_to_agent_map.get(target_flow, target_flow)
                    if not target_node:
                        target_node = flow_root_nodes.get(target_flow)
                    handoff_target = {
                        "target_flow": target_flow,
                        "target_node": target_node,
                        "agent_name": target_agent
                    }
                    transitioned = True
                    break
                else:
                    if target_node:
                        current_node_id = target_node
                    else:
                        current_node_id = "END"
                    transitioned = True
                    break

        if handoff_target:
            break

        if transitioned:
            depth += 1
            continue

        # Check if node has intent routes or global routes
        has_intent_routes = "intent_routes" in node and len(node["intent_routes"]) > 0
        has_local_globals = "global_intent_routes" in flow_definition and len(flow_definition["global_intent_routes"]) > 0
        has_main_globals = len(main_global_intent_routes) > 0

        if has_intent_routes or has_local_globals or has_main_globals:
            break
        else:
            current_node_id = "END"
            accumulated_instructions.append(
                "The flow has ended unexpectedly with no valid routes. Terminate the conversation."
            )
            break

    if depth >= max_traversal_depth:
        current_node_id = "END"
        accumulated_instructions.append("System Error: Traversal loop detected. Perform a human escalation.")

    # Handle condition-triggered handoff
    if handoff_target:
        state["int__target_agent_handoff"] = handoff_target["agent_name"]
        t_node = handoff_target["target_node"]
        state["int__target_node"] = t_node
        state["int__available_node_ids"] = [{"flow_id": handoff_target["target_flow"], "node_id": t_node}] if t_node else []
        return {
            "status": "handoff",
            "handoff_agent": handoff_target["agent_name"],
            "target_flow": handoff_target["target_flow"],
            "target_node": handoff_target["target_node"],
            "accumulated_instructions": accumulated_instructions,
            "action_results": action_results,
            "available_intent_transitions": []
        }

    # 5. Assemble available intent routes for the LLM
    available_intent_transitions = []
    next_available_node_ids = []
    if current_node_id != "END":
        active_node = nodes_lookup.get(current_node_id, {})

        # Add local intent routes
        for intent_route in active_node.get("intent_routes", []):
            route_copy = intent_route.copy()
            t_flow = route_copy.get("target_flow")
            t_node = route_copy.get("target_node")
            if t_flow:
                if not t_node:
                    t_node = flow_root_nodes.get(t_flow)
                    if t_node:
                        route_copy["target_node"] = t_node
                if t_flow != current_flow_id:
                    next_available_node_ids.append({"flow_id": t_flow, "node_id": t_node})
                else:
                    if t_node:
                        next_available_node_ids.append({"flow_id": current_flow_id, "node_id": t_node})
            else:
                if t_node:
                    next_available_node_ids.append({"flow_id": current_flow_id, "node_id": t_node})
            available_intent_transitions.append(route_copy)

        # Add global routes of current flow
        for global_route in flow_definition.get("global_intent_routes", []):
            g_route_copy = global_route.copy()
            g_route_copy["is_global"] = True
            t_flow = g_route_copy.get("target_flow")
            t_node = g_route_copy.get("target_node")
            if t_flow:
                if not t_node:
                    t_node = flow_root_nodes.get(t_flow)
                    if t_node:
                        g_route_copy["target_node"] = t_node
                if t_flow != current_flow_id:
                    next_available_node_ids.append({"flow_id": t_flow, "node_id": t_node})
                else:
                    if t_node:
                        next_available_node_ids.append({"flow_id": current_flow_id, "node_id": t_node})
            else:
                if t_node:
                    next_available_node_ids.append({"flow_id": current_flow_id, "node_id": t_node})
            available_intent_transitions.append(g_route_copy)

        # Add inherited main flow global routes
        for main_global_route in main_global_intent_routes:
            m_route_copy = main_global_route.copy()
            m_route_copy["is_global"] = True
            t_flow = m_route_copy.get("target_flow")
            t_node = m_route_copy.get("target_node")
            if not t_flow:
                for fid, aname in flow_to_agent_map.items():
                    if aname == 'main' or aname == 'root-agent':
                        t_flow = fid
                        break
                if t_flow:
                    m_route_copy["target_flow"] = t_flow
            if t_flow:
                if not t_node:
                    t_node = flow_root_nodes.get(t_flow)
                    if t_node:
                        m_route_copy["target_node"] = t_node
                if t_flow != current_flow_id:
                    next_available_node_ids.append({"flow_id": t_flow, "node_id": t_node})
                else:
                    if t_node:
                        next_available_node_ids.append({"flow_id": current_flow_id, "node_id": t_node})
            else:
                if t_node:
                    next_available_node_ids.append({"flow_id": current_flow_id, "node_id": t_node})
            available_intent_transitions.append(m_route_copy)

    # Save available node IDs for next turn
    unique_node_ids = []
    seen = set()
    for item in next_available_node_ids:
        key = (item.get("flow_id"), item.get("node_id"))
        if key not in seen:
            seen.add(key)
            unique_node_ids.append(item)

    state["int__available_node_ids"] = unique_node_ids
    state["int__current_flow_id"] = current_flow_id
    state["int__target_agent_handoff"] = None
    state["int__target_node"] = None

    return {
        "status": "success",
        "current_flow_id": current_flow_id,
        "current_node_id": current_node_id,
        "accumulated_instructions": accumulated_instructions,
        "action_results": action_results,
        "available_intent_transitions": available_intent_transitions
    }

def tool_exception(exc: Exception) -> dict:
    """Standard error reporting helper."""
    import traceback
    return {
        "status": "error",
        "exception": str(type(exc).__name__) + ": " + str(exc),
        "traceback": traceback.format_stack()
    }
`

export async function exportMultiAgentGraphGuided(
  context: CxasExportContext,
  agentDirName: string,
  files: string[]
): Promise<void> {
  const { folderPath, zip, projectName, variablesMap, toolsMap } = context;

  // 1. Resolve blueprint directory for templates
  const ggBlueprintDir = getAssetsPath('src/core/assets/cxas_graph_guided_blueprint');
  if (!fs.existsSync(ggBlueprintDir)) {
    throw new Error(`Graph guided blueprint directory not found at ${ggBlueprintDir}`);
  }

  const appJsonTemplate = JSON.parse(fs.readFileSync(path.join(ggBlueprintDir, 'app.json'), 'utf-8'));
  const environmentJsonTemplate = JSON.parse(fs.readFileSync(path.join(ggBlueprintDir, 'environment.json'), 'utf-8'));

  // 2. Build unified SOP specification
  const sopSpec = buildUnifiedSop(projectName, folderPath);
  const flows = ((sopSpec as any).sop?.flows || (sopSpec as any).flows || {}) as Record<string, any>;

  // Find main flow details
  const { mainFlowId, rootNodeId: mainRootNodeId } = findMainFlowDetails(folderPath, files);
  if (!mainFlowId || !mainRootNodeId) {
    throw new Error(`Could not determine main flow ID or root node ID for project ${projectName}`);
  }

  const normalizeFlowId = (f: string) => f.replace(/\.(yaml|yml)$/i, '').toLowerCase();

  // 3. Inspect all flows and build metadata
  const flowMetas = new Map<string, FlowMeta>();
  const flowIdToAgentMap: Record<string, string> = {};
  const flowRootNodes: Record<string, string> = {};

  for (const [rawFlowId, flowData] of Object.entries<any>(flows)) {
    const flowId = flowData.id || rawFlowId;
    const isMainFlow = normalizeFlowId(flowId) === normalizeFlowId(mainFlowId);
    const agentFolderName = isMainFlow ? 'main' : sanitizeResourceId(flowId.toLowerCase());
    const agentName = isMainFlow ? 'root-agent' : agentFolderName;
    const enterNodeToolName = getEnterNodeToolName(flowId);
    const toolPrefix = enterNodeToolName.replace(/_enter_node$/, '');
    const rootNode = flowData.root_node_id || 'welcome';

    flowRootNodes[flowId] = rootNode;
    flowRootNodes[normalizeFlowId(flowId)] = rootNode;
    flowRootNodes[rawFlowId] = rootNode;
    flowRootNodes[agentFolderName] = rootNode;

    const referencedFlows = new Set<string>();

    const nodes = flowData.nodes || [];
    nodes.forEach((node: any) => {
      if (node.intent_routes && Array.isArray(node.intent_routes)) {
        node.intent_routes.forEach((r: any) => {
          if (r.target_flow) {
            referencedFlows.add(r.target_flow);
          }
        });
      }

      if (node.condition_routes && Array.isArray(node.condition_routes)) {
        node.condition_routes.forEach((r: any) => {
          if (r.target_flow) {
            referencedFlows.add(r.target_flow);
          }
        });
      }
    });

    if (flowData.global_intent_routes && Array.isArray(flowData.global_intent_routes)) {
      flowData.global_intent_routes.forEach((r: any) => {
        if (r.target_flow) {
          referencedFlows.add(r.target_flow);
        }
      });
    }

    const meta: FlowMeta = {
      flowId,
      isMainFlow,
      agentFolderName,
      agentName,
      toolPrefix,
      enterNodeToolName,
      rootNodeId: rootNode,
      flowData,
      referencedFlows
    };

    flowMetas.set(flowId, meta);
    flowIdToAgentMap[flowId] = agentFolderName;
    flowIdToAgentMap[normalizeFlowId(flowId)] = agentFolderName;
    flowIdToAgentMap[rawFlowId] = agentFolderName;
  }

  // Find inherited global intent routes from main flow
  const mainMeta = Array.from(flowMetas.values()).find(m => m.isMainFlow);
  const mainGlobalRoutes = (mainMeta?.flowData?.global_intent_routes || []).map((r: any) => {
    const targetFlow = r.target_flow || mainMeta?.flowId || mainFlowId;
    const targetNode = r.target_node || flowRootNodes[targetFlow] || flowRootNodes[normalizeFlowId(targetFlow)];
    const routeCopy = {
      ...r,
      target_flow: targetFlow,
      ...(targetNode ? { target_node: targetNode } : {}),
      is_global: true
    };
    delete routeCopy.review_requests;
    return routeCopy;
  });

  // 4. Build Child Agent Hierarchy Tree
  // Rules:
  // - Root agent `main` implements main flow and is connected to the flows it references.
  // - Sub agents can have child agents ONLY if these are not already child agents of another agent.
  // - Every sub-agent is attached to exactly one parent (no multiple parents in CXAS).
  const claimedAgents = new Set<string>(['main']);
  const childAgentsMap = new Map<string, string[]>();
  const allAgentFolderNames = Array.from(flowMetas.values()).map(m => m.agentFolderName);

  for (const folder of allAgentFolderNames) {
    childAgentsMap.set(folder, []);
  }

  // 1) Main agent references first
  if (mainMeta) {
    for (const refFlow of mainMeta.referencedFlows) {
      const targetAgent = flowIdToAgentMap[refFlow] || flowIdToAgentMap[normalizeFlowId(refFlow)] || sanitizeResourceId(refFlow.toLowerCase());
      if (targetAgent && targetAgent !== 'main' && !claimedAgents.has(targetAgent)) {
        childAgentsMap.get('main')!.push(targetAgent);
        claimedAgents.add(targetAgent);
      }
    }
  }

  // 2) Other sub-agents in order
  for (const meta of flowMetas.values()) {
    if (meta.isMainFlow) continue;
    for (const refFlow of meta.referencedFlows) {
      const targetAgent = flowIdToAgentMap[refFlow] || flowIdToAgentMap[normalizeFlowId(refFlow)] || sanitizeResourceId(refFlow.toLowerCase());
      if (targetAgent && targetAgent !== 'main' && !claimedAgents.has(targetAgent)) {
        childAgentsMap.get(meta.agentFolderName)!.push(targetAgent);
        claimedAgents.add(targetAgent);
      }
    }
  }

  // 3) Any remaining unclaimed sub-agents attach to main
  for (const folder of allAgentFolderNames) {
    if (folder !== 'main' && !claimedAgents.has(folder)) {
      childAgentsMap.get('main')!.push(folder);
      claimedAgents.add(folder);
    }
  }

  // 5. Extract and generate all business tools
  collectTools(folderPath, files, toolsMap);
  await generateTools(context, agentDirName);

  // 6. Generate flow-prefixed enter_node tools for each flow with vendorized engine code
  for (const meta of flowMetas.values()) {
    const { flowId, enterNodeToolName, flowData, isMainFlow, rootNodeId: rootNode } = meta;

    const strippedFlow = optimizeSopForRuntime(flowData);
    if (!strippedFlow.id) {
      strippedFlow.id = flowId;
    }
    if (!strippedFlow.root_node_id) {
      strippedFlow.root_node_id = rootNode;
    }
    const formattedFlowSpec = await formatAsPythonDict(strippedFlow, { indent: 2, baseIndent: 0 });
    const formattedMainGlobals = await formatAsPythonDict(isMainFlow ? [] : mainGlobalRoutes, { indent: 2, baseIndent: 0 });
    const formattedFlowToAgentMap = await formatAsPythonDict(flowIdToAgentMap, { indent: 2, baseIndent: 0 });
    const formattedFlowRootNodes = await formatAsPythonDict(flowRootNodes, { indent: 2, baseIndent: 0 });

    const enterNodeToolMetadata = {
      name: enterNodeToolName,
      pythonFunction: {
        name: enterNodeToolName,
        pythonCode: `tools/${enterNodeToolName}/python_function/python_code.py`,
        description: `Traverses the deterministic flow for '${flowId}' programmatically tracking state, executing actions, and evaluating conditions.`
      },
      executionType: "SYNCHRONOUS",
      displayName: enterNodeToolName
    };

    const enterNodeToolPythonCode = `# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import traceback
from typing import Dict, Any, Optional, List
import re

FLOW_DEFINITION = ${formattedFlowSpec}
MAIN_GLOBAL_INTENT_ROUTES = ${formattedMainGlobals}
FLOW_TO_AGENT_MAP = ${formattedFlowToAgentMap}
FLOW_ROOT_NODES = ${formattedFlowRootNodes}

def ${enterNodeToolName}(
    node_id: Optional[str] = None,
    flow_id: Optional[str] = None,
    set_variables: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Traverses the deterministic flow for ${flowId} programmatically tracking state and resolving decision trees.
    
    Args:
        node_id: The ID of the node to enter in this flow (or flow root node).
        flow_id: Optional flow identifier if transitioning to a target flow.
        set_variables: Key-value map of variables extracted from user message.
    """
    try:
        return enter_node_wrapped(
            node_id=node_id,
            flow_id=flow_id,
            set_variables=set_variables or {},
            flow_definition=FLOW_DEFINITION,
            main_global_intent_routes=MAIN_GLOBAL_INTENT_ROUTES,
            flow_to_agent_map=FLOW_TO_AGENT_MAP,
            flow_root_nodes=FLOW_ROOT_NODES
        )
    except Exception as exc:
        return tool_exception(exc)

${VENDORIZED_ENGINE_PYTHON_CODE}
`;

    zip.addFile(`${agentDirName}/tools/${enterNodeToolName}/${enterNodeToolName}.json`, Buffer.from(JSON.stringify(enterNodeToolMetadata, null, 2), 'utf-8'));
    zip.addFile(`${agentDirName}/tools/${enterNodeToolName}/python_function/python_code.py`, Buffer.from(enterNodeToolPythonCode, 'utf-8'));
  }

  // 7. Write Agents configuration, instructions, and before_model_callbacks
  for (const meta of flowMetas.values()) {
    const { flowId, agentFolderName, agentName, enterNodeToolName, rootNodeId } = meta;
    const childAgents = childAgentsMap.get(agentFolderName) || [];

    const beforeModelCallbackPythonCode = `# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from typing import Optional

FLOW_ID = "${flowId}"
ROOT_NODE_ID = "${rootNodeId}"
ENTER_NODE_TOOL = "${enterNodeToolName}"

def before_model_callback(callback_context: CallbackContext, llm_request: LlmRequest) -> Optional[LlmResponse]:
    """Inspects session state for deterministic agent handoffs or initial node entry.
    
    1. If a handoff to another agent was requested during node traversal, overrides
       model execution to issue an immediate agent transfer.
    2. If this agent is being entered for the first time (or newly entered via transfer),
       triggers the enter_node function call on the target node before the model runs.
    """
    state = callback_context.state
    
    # 1. Deterministic agent transfer
    target_agent = state.get("int__target_agent_handoff")
    if target_agent:
        state["int__target_agent_handoff"] = None
        return LlmResponse.from_parts(parts=[
            Part.from_agent_transfer(agent=target_agent)
        ])
    
    # 2. First turn in this agent flow: invoke enter_node tool automatically
    current_flow = state.get("int__current_flow_id")
    if current_flow != FLOW_ID:
        target_node = state.get("int__target_node") or ROOT_NODE_ID
        state["int__target_node"] = None
        return LlmResponse.from_parts(parts=[
            Part.from_function_call(
                name=ENTER_NODE_TOOL,
                args={"node_id": target_node, "set_variables": {}}
            )
        ])
    
    return None
`;

    const agentToolsList = [enterNodeToolName, 'end_session'];
    const agentMetadata = {
      name: agentName,
      displayName: agentFolderName,
      description: `Flow agent for ${flowId}`,
      instruction: `agents/${agentFolderName}/instruction.txt`,
      childAgents: childAgents,
      tools: agentToolsList,
      beforeModelCallbacks: [
        {
          pythonCode: `agents/${agentFolderName}/before_model_callbacks/before_model_callbacks_01/python_code.py`,
          description: `Deterministic handoff and first-turn enter_node callback to transfer conversation or initialize flow state`
        }
      ]
    };

    const subagentInstruction = `<role>You are the dedicated deterministic flow specialist for {ui__brand_name}, executing predefined processes for the ${flowId} flow.</role>
<constraints>
    1. Only answer business related questions, dismiss anything that is not related to your scope.
    2. CRITICAL - ALL ROUTING VIA {@TOOL: ${enterNodeToolName}}: All flow navigation and transitions (both within this flow and to other flows/topics) MUST be performed exclusively by invoking your enter node tool {@TOOL: ${enterNodeToolName}}. NEVER perform direct agent transfers or handoffs when a matching transition exists in \`available_intent_transitions\`.
    3. CRITICAL - HANDOFFS TO MAIN ARE LAST RESORT: Handoffs to \`main\` (or root agent) are strictly the VERY LAST RESORT, only permitted if there is NO matching option in \`available_intent_transitions\` and the customer query is completely unhandled and out-of-scope. If ANY option in \`available_intent_transitions\` matches the customer's request (e.g. asking about bills, charges, payments, disputes, complaints, etc.), you MUST invoke {@TOOL: ${enterNodeToolName}} with that transition's \`target_node\` and \`target_flow\`.
    4. You may ONLY transition to routes explicitly listed in the \`available_intent_transitions\` returned by your LATEST call to {@TOOL: ${enterNodeToolName}}. NEVER pick a node ID from previous conversation turns or older tool calls. Entering nodes from previous turns will break the flow and is strictly forbidden, even if the old node ID seems 100% relevant to the customer's current message.
    5. Do not execute backend actions yourself. Backend tools are handled by the engine programmatically. Relay the \`action_results\` to the customer exactly as dictated by the \`accumulated_instructions\`.
    6. Maintain a seamless conversational illusion. Never mention node IDs, technical states, sub-agent handovers, or internal tool mechanisms to the customer.
    7. Transition Goal: Try your best to enter at least one node at every turn (when in doubt, make a logical selection). Do not ask for confirmation for every minor ambiguity.
</constraints>

<ambiguity_handling>
    You are allowed to stay in the current node (i.e. not call {@TOOL: ${enterNodeToolName}}) only if the user says something completely unrelated, or that unequivocally requires disambiguation/clarification.
    Use this example scenario to resolve ambiguities. Imagine an agent that has two intents \`dispute_bill\` and \`check_bill\`:
    - Pick closest intent: If customer asks "Why was my bill so high??", make a judgment call and pick \`dispute_bill\` (not \`check_bill\`).
    - Pursue hopeful paths: If customer asks to "download PDF of my latest bill", pick \`check_bill\` to progress the flow (if the PDF option is missing, explain later).
    - Vague requests: If customer says "I have a question about my bill", stop and ask what the question is.
    - Bad input: If customer says something confusing/garbled (e.g. bad audio signal), stop and ask to rephrase.
    - Meta-questions: If customer asks "what can you help me with?", stop and explain the options. If they ask "what's your name?", stop and answer out of your own knowledge.
</ambiguity_handling>

<taskflow>
    <subtask name="deterministic-flow-navigation">
        <step name="process-customer-turn">
            <trigger>Upon receiving a message from the customer.</trigger>
            <action>
                1. Execute the **Transition Loop**:
                   - Look at the \`available_intent_transitions\` in the LATEST {@TOOL: ${enterNodeToolName}} response (an active enter node call is always present in your context).
                   - Compare the customer's message (and any current context) against these transitions.
                   - If the customer's intent or information matches one of the transitions (applying <ambiguity_handling> rules):
                     a. Extract any variables specified by the transition from the customer's message.
                     b. Invoke {@TOOL: ${enterNodeToolName}} using this exact payload structure:
                        {
                          "node_id": "<target_node>",
                          "flow_id": "<target_flow if specified, otherwise '${flowId}'>",
                          "set_variables": { ... }
                        }
                        CRITICAL: Even if \`target_flow\` points to another flow (e.g. other sub-flows), ALWAYS call {@TOOL: ${enterNodeToolName}} with that \`flow_id\` and \`node_id\`. Do NOT execute a direct agent handoff.
                     c. Once the tool returns:
                        - If the tool indicates a handoff to another flow agent (e.g. \`status: "handoff"\`), STOP immediately and do NOT generate any user response text; the system callback will automatically transfer the conversation to the target agent.
                        - Otherwise, repeat this **Transition Loop** recursively on the new output if needed. Do NOT respond to the customer yet.
                   - If none of the available transitions match:
                     - If the request is completely outside this flow and unhandled by any available transition, as a fallback of last resort hand off to \`main\`.
                     - Otherwise (e.g. staying in the current node per <ambiguity_handling> to clarify), stop the loop and proceed to the next step.
                2. Finalize Turn:
                   - If the final \`current_node_id\` is "END":
                     - Fulfill all \`accumulated_instructions\` to conclude the conversation and invoke {@TOOL: end_session} to terminate the session. Use {@TOOL: end_session} AFTER you have sent your last message.
                   - Otherwise:
                     - Generate your response to the customer. Fulfill all \`accumulated_instructions\` and format any \`action_results\` returned in the *final* {@TOOL: ${enterNodeToolName}} output. Do NOT show or use intermediate instructions or results from earlier calls in the chain.
            </action>
        </step>
    </subtask>
</taskflow>
`;

    zip.addFile(`${agentDirName}/agents/${agentFolderName}/${agentFolderName}.json`, Buffer.from(JSON.stringify(agentMetadata, null, 2), 'utf-8'));
    zip.addFile(`${agentDirName}/agents/${agentFolderName}/instruction.txt`, Buffer.from(subagentInstruction, 'utf-8'));
    zip.addFile(`${agentDirName}/agents/${agentFolderName}/before_model_callbacks/before_model_callbacks_01/python_code.py`, Buffer.from(beforeModelCallbackPythonCode, 'utf-8'));
  }

  // 8. Write App & Environment configs
  let inputVars: any[] = [];
  let globalInstructions: string = '';
  let promptGuard: string = '';
  const mainFile = files.find(f => f === 'main.yml' || f === 'main.yaml') || files.find(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  if (mainFile) {
    try {
      const content = fs.readFileSync(path.join(folderPath, mainFile), 'utf-8');
      const parsed = YAML.parse(content);
      if (parsed?.flow?.input_variables) {
        inputVars = parsed.flow.input_variables;
      }
      if (parsed?.flow?.global_instructions) {
        globalInstructions = parsed.flow.global_instructions;
      }
      if (parsed?.flow?.prompt_guard) {
        promptGuard = parsed.flow.prompt_guard;
      }
    } catch {
      // ignore
    }
  }

  const extraVars = Array.from(variablesMap.entries()).map(([name, type]) => {
    const definedVar = inputVars.find((v: any) => (typeof v === 'string' ? v : v?.name) === name);
    const defaultValue = definedVar && typeof definedVar !== 'string' ? definedVar.default : undefined;
    return {
      name: `sop__${name}`,
      description: `Variable ${name} defined in SOP.`,
      schema: {
        type,
        ...(defaultValue !== undefined ? { default: defaultValue } : {})
      }
    };
  });

  const appJson: any = {
    ...appJsonTemplate,
    name: agentDirName,
    displayName: formatProjectName(projectName),
    description: `CX Agent Studio export (Graph Guided Multi-Agent) for ${projectName}`,
    rootAgent: 'main',
    ...(globalInstructions ? { globalInstruction: 'global_instruction.txt' } : {}),
    variableDeclarations: [
      ...(appJsonTemplate.variableDeclarations || []),
      {
        name: 'ui__mock_journey',
        description: '(ui) Specifies a mock journey for selecting mock tool payloads.',
        schema: {
          type: 'STRING',
          default: 'default'
        }
      },
      {
        name: 'ui__brand_name',
        description: '(ui) Brand name of the company.',
        schema: {
          type: 'STRING',
          default: formatProjectName(projectName)
        }
      },
      ...extraVars
    ]
  };

  if (promptGuard && promptGuard.trim() !== '') {
    appJson.guardrails = [GUARDRAIL_DISPLAY_NAME];
    const guardrailJson = {
      name: GUARDRAIL_ID,
      displayName: GUARDRAIL_DISPLAY_NAME,
      enabled: true,
      action: {
        generativeAnswer: {}
      },
      llmPromptSecurity: {
        customPolicy: {
          maxConversationMessages: 1,
          prompt: promptGuard.trim()
        }
      }
    };
    zip.addFile(`${agentDirName}/guardrails/${GUARDRAIL_DIR_NAME}/${GUARDRAIL_DIR_NAME}.json`, Buffer.from(JSON.stringify(guardrailJson, null, 2), 'utf-8'));
  }

  zip.addFile(`${agentDirName}/app.json`, Buffer.from(JSON.stringify(appJson, null, 2), 'utf-8'));
  zip.addFile(`${agentDirName}/environment.json`, Buffer.from(JSON.stringify(environmentJsonTemplate, null, 2), 'utf-8'));

  if (globalInstructions) {
    zip.addFile(`${agentDirName}/global_instruction.txt`, Buffer.from(globalInstructions, 'utf-8'));
  }

  // 9. Write Evaluations (Golden & Scenario Cases)
  const warnings: string[] = context.warnings || [];
  if (sopSpec.sop?.example_journeys && Array.isArray(sopSpec.sop.example_journeys)) {
    sopSpec.sop.example_journeys.forEach((journey: any) => {
      if (!journey.name || !journey.steps || !Array.isArray(journey.steps)) return;

      // Write Golden Case
      const goldenDisplayName = `Golden - ${journey.name}`;
      const sanitizedGoldenName = sanitizeResourceId(goldenDisplayName);
      const goldenEvalJson = buildMultiAgentGraphGuidedEvaluationJson(journey, sopSpec, mainFlowId, goldenDisplayName, flowIdToAgentMap);
      if (goldenEvalJson.warnings && goldenEvalJson.warnings.length > 0) {
        warnings.push(...goldenEvalJson.warnings);
      }

      zip.addFile(
        `${agentDirName}/evaluations/${sanitizedGoldenName}/${sanitizedGoldenName}.json`,
        Buffer.from(JSON.stringify(goldenEvalJson, null, 2), 'utf-8')
      );

      // Write Scenario Case
      const scenarioDisplayName = `Scenario - ${journey.name}`;
      const sanitizedScenarioName = sanitizeResourceId(scenarioDisplayName);
      const scenarioEvalJson = buildScenarioEvaluationJson(journey, scenarioDisplayName);

      zip.addFile(
        `${agentDirName}/evaluations/${sanitizedScenarioName}/${sanitizedScenarioName}.json`,
        Buffer.from(JSON.stringify(scenarioEvalJson, null, 2), 'utf-8')
      );
    });
  }
  context.warnings = warnings;
}
