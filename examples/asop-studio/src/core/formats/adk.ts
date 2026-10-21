import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import YAML from 'yaml';
import type { FormatModule, ExportOptions, ExportResult } from './types';
import { buildUnifiedSop, formatProjectName, optimizeSopForRuntime, getAssetsPath } from './utils';
import { formatAsPythonDict } from './pythonSerializer';

// Helper to normalize strings to valid Python identifiers
function normalizePythonIdentifier(name: string): string {
  let normalized = name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  if (/^[0-9]/.test(normalized)) {
    normalized = '_' + normalized;
  }
  return normalized;
}

// Helper to map variable references in instruction texts
function mapVariableReferences(text: string, variablesMap: Map<string, string>): string {
  let mapped = text;
  variablesMap.forEach((_, name) => {
    const regex = new RegExp(`\\{?\\b(?!sop__)${name}\\b\\}?`, 'g');
    mapped = mapped.replace(regex, `sop__${name}`);
  });
  return mapped;
}

export const adkFormat: FormatModule = {
  id: 'adk',

  async export({ projectName, folderPath, mode }: ExportOptions): Promise<ExportResult> {
    const finalMode = mode || 'fully-agentic';

    if (finalMode === 'graph-guided') {
      // 1. Resolve ADK Blueprint Dir
      const adkBlueprintDir = getAssetsPath('src/core/assets/adk_graph_guided_blueprint');
      if (!fs.existsSync(adkBlueprintDir)) {
        throw new Error(`ADK graph guided blueprint directory not found at ${adkBlueprintDir}`);
      }

      // 2. Load templates from ADK Blueprint
      const mainAgentInstructionTemplate = fs.readFileSync(path.join(adkBlueprintDir, 'agents/main/instruction.txt'), 'utf-8');
      const flowAgentInstructionTemplate = fs.readFileSync(path.join(adkBlueprintDir, 'agents/flow_agent/instruction.txt'), 'utf-8');
      const enterNodePythonCode = fs.readFileSync(path.join(adkBlueprintDir, 'tools/enter_node/python_function/python_code.py'), 'utf-8');

      // 3. Build unified SOP structure
      const unifiedSop = buildUnifiedSop(projectName, folderPath);
      const flows = unifiedSop.sop.flows;

      // Find main flow details (main flow ID and its root node ID)
      const files = fs.readdirSync(folderPath);
      const { mainFlowId, rootNodeId } = findMainFlowDetails(folderPath, files);
      if (!mainFlowId || !rootNodeId) {
        throw new Error(`Could not determine main flow ID or root node ID for project ${projectName}`);
      }

      // 4. Generate start_flow tool details
      const cleanProjectName = projectName.toLowerCase().replace(/[-]/g, '_');
      const startToolName = cleanProjectName.endsWith('_flow')
        ? `start_${cleanProjectName}`
        : `start_${cleanProjectName}_flow`;

      const strippedSop = optimizeSopForRuntime(unifiedSop);
      const formattedFlowSpec = await formatAsPythonDict(strippedSop, { indent: 2, baseIndent: 0 });
      const brandName = formatProjectName(projectName);
      const startToolPythonCode = `# Copyright 2026 Google LLC
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
from typing import Dict, Any, Optional
from google.adk import Context

FLOW_SPEC = ${formattedFlowSpec}

def ${startToolName}(context: Context, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Prepares required data for 'flow_agent' to run on ${projectName}. 1) This tool prepares data for 'flow_agent' and must be called before any handoff to 'flow_agent'. 2) 'flow_agent' should be invoked immediately and silently right after receiving this result, never before."""
    try:
        return start_flow_wrapped(context, params)
    except Exception as exc:
        return tool_exception(exc)

def start_flow_wrapped(context: Context, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    state = context.state
    
    # Set a variable with the JSON flow specification
    state["int__flow_specification"] = FLOW_SPEC
    
    # Set the current flow ID to the main flow ID
    main_flow_id = "${mainFlowId}"
    state["int__current_flow_id"] = main_flow_id
    
    # Set a variable with the root node id
    root_node_id = "${rootNodeId}"
    state["int__flow_root_node_id"] = root_node_id
    
    # Initially, only the root node of main flow is available to transition to
    state["int__available_node_ids"] = [{"flow_id": main_flow_id, "node_id": root_node_id}]
    
    # Brand name for instruction template substitution
    state["ui__brand_name"] = "${brandName}"
    
    # Set input variables defined in the main flow
    if "sop" in FLOW_SPEC:
        sop_data = FLOW_SPEC["sop"]
    else:
        sop_data = FLOW_SPEC
    main_flow = sop_data.get("flows", {}).get(main_flow_id, {})
    input_vars = main_flow.get("input_variables", [])
    for var in input_vars:
        var_name = var.get("name")
        default_val = var.get("default")
        if var_name and var_name not in state:
            state[var_name] = default_val
            
    return {
        "status": "success",
        "instruction": "Flow prepared successfully. Perform an IMMEDIATE and SILENT transfer to the 'flow_agent' sub agent. Do not output any further messages.",
        "root_node_id": root_node_id,
        "current_flow_id": main_flow_id
    }

def tool_exception(exc: Exception) -> dict:
    """Standard error reporting helper."""
    import traceback
    return {
        "status": "error",
        "exception": str(type(exc).__name__) + ": " + str(exc),
        "traceback": traceback.format_stack()
    }
`;

      // 5. Generate enter_node tool code
      const enterNodeCode = enterNodePythonCode;

      // 6. Identify business tools across all flows
      const toolsMap = new Map<string, { params: Set<string>; mockResponses: Record<string, any>; storeResultVariables: Set<string> }>();
      for (const flowSpec of Object.values(flows)) {
        if (flowSpec.nodes && Array.isArray(flowSpec.nodes)) {
          flowSpec.nodes.forEach((node: any) => {
            if (node.actions && Array.isArray(node.actions)) {
              node.actions.forEach((act: any) => {
                if (act.type === 'tool' && act.tool_name) {
                  const toolName = act.tool_name;
                  const params = act.tool_params ? Object.keys(act.tool_params) : [];
                  const mockResponses = act.mock_responses || {};

                  if (!toolsMap.has(toolName)) {
                    toolsMap.set(toolName, { params: new Set(), mockResponses: {}, storeResultVariables: new Set() });
                  }
                  const toolData = toolsMap.get(toolName)!;
                  params.forEach(p => toolData.params.add(p));
                  Object.assign(toolData.mockResponses, mockResponses);
                  if (act.store_result_variable) {
                    toolData.storeResultVariables.add(act.store_result_variable);
                  }
                }
              });
            }
          });
        }
      }

      // Generate Python functions for all tools
      let pythonToolsCode = '';
      for (const [toolName, toolData] of toolsMap.entries()) {
        const paramsList = Array.from(toolData.params);
        const paramsSignature = ['context: Context', ...paramsList.map(p => `${p}: Optional[Any] = None`)].join(', ');
        const docstringArgs = paramsList.map(p => `        ${p}: Parameter for ${toolName}`).join('\n');
        const formattedMocks = await formatAsPythonDict(toolData.mockResponses, { indent: 2, baseIndent: 4 });

        const storeVars = toolData.storeResultVariables ? Array.from(toolData.storeResultVariables) : [];
        const storeAssignments = storeVars.map(v => `    context.state["sop__${v}"] = result`).join('\n');

        pythonToolsCode += `def ${normalizePythonIdentifier(toolName)}(${paramsSignature}) -> Dict[str, Any]:
    """Mocked tool implementation for ${toolName}.

    Args:
${docstringArgs}
    """
    mock_responses = ${formattedMocks}
    journey = "default"
    try:
        if context and context.state:
            journey = context.state.get("ui__mock_journey", "default")
    except NameError:
        pass
    result = mock_responses.get(journey, list(mock_responses.values())[0] if mock_responses else {})
${storeAssignments}
    return result


`;
      }

      // 7. Prepare Instructions
      // Flow Agent
      const flowAgentInstruction = flowAgentInstructionTemplate.replace(/{ui__brand_name}/g, brandName);
      const escapedFlowAgentInstruction = flowAgentInstruction.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');

      // Main Agent Coordinator
      const routingInstructions = [
        `- Perform an IMMEDIATE and SILENT transfer to the sub-agent: {@AGENT: flow_agent} after invoking {@TOOL: ${startToolName}}`
      ];
      let rootAgentInstruction = mainAgentInstructionTemplate.replace(
        '{routing_instructions}',
        routingInstructions.join('\n        ')
      );
      rootAgentInstruction = rootAgentInstruction.replace(
        /{start_tool_name}/g,
        startToolName
      );
      rootAgentInstruction = `<!-- NOTE: a "Before LLM" callback will programmatically load and transition to the given SOP. These instructions are here for reference, but will never be executed. -->\n\n` + rootAgentInstruction;
      const escapedRootAgentInstruction = rootAgentInstruction.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');

      // 8. Generate specialized agents Python code
      const pythonAgentsCode = `def before_model_callback(callback_context: Context, llm_request: Any) -> Optional[LlmResponse]:
    """Forces the execution of the ${projectName} SOP.
    
    This callback executes before the main agent model runs. It initializes the flow state
    using the start tool and immediately transitions control to the agnostic flow_agent.
    """
    # Setup flow execution: initialize variables and load flow spec
    ${startToolName}(callback_context, {})

    # Force handoff: set transfer target and return an empty model response to skip model call
    callback_context.actions.transfer_to_agent = "flow_agent"
    return LlmResponse(content=types.Content(role="model", parts=[types.Part(text="")]))


flow_agent = Agent(
    name="flow_agent",
    model="gemini-3.5-flash",
    instruction="""${escapedFlowAgentInstruction}""",
    tools=[enter_node]
)

main_agent = Agent(
    name="main",
    model="gemini-3.5-flash",
    description="Main entry point coordinator agent for Graph Guided flow. Automatically transitions to flow_agent using a before_model_callback.",
    instruction="""${escapedRootAgentInstruction}""",
    tools=[${startToolName}],
    sub_agents=[flow_agent],
    before_model_callback=before_model_callback
)
`;

      // 9. Set the root agent directly to main_agent to enable proper multi-turn routing
      const workflowPython = `root_agent = main_agent\n`;

      const agentPyContent = `# filename: agent.py
import re
import traceback
from google.adk import Agent, Workflow, Context
from google.adk.models.llm_response import LlmResponse
from google.genai import types
from typing import Dict, Any, Optional, List

# ==========================================
# 1. DEFINE MOCK PYTHON TOOLS
# ==========================================

${pythonToolsCode.trim()}


# ==========================================
# 2. DEFINE TRAVERSAL & START FLOW TOOLS
# ==========================================

${enterNodeCode.trim()}


${startToolPythonCode.trim()}


# ==========================================
# 3. DEFINE SPECIALIZED AGENTS
# ==========================================

${pythonAgentsCode.trim()}


# ==========================================
# 4. COMPILE INTO THE ORCHESTRATION GRAPH
# ==========================================

${workflowPython.trim()}
`;

      const agentName = projectName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
      const zipFolderName = `${agentName}__adk_graph_guided`;
      // Write manifest and code to ZIP
      const adkJson = JSON.stringify({
        name: zipFolderName,
        version: "1.0.0",
        description: `Agent Design Kit export (Graph Guided) for ${projectName}`,
        entryPoint: "agent.py"
      }, null, 2);
      const zipGG = new AdmZip();
      zipGG.addFile(`${zipFolderName}/adk.json`, Buffer.from(adkJson, 'utf-8'));
      zipGG.addFile(`${zipFolderName}/agent.py`, Buffer.from(agentPyContent, 'utf-8'));

      const adkBuffer = zipGG.toBuffer();

      return {
        data: adkBuffer,
        contentType: 'application/zip',
        filename: `${zipFolderName}.zip`
      };
    }

    const zip = new AdmZip();

    // 1. Build unified SOP structure
    const unifiedSop = buildUnifiedSop(projectName, folderPath);
    const flows = unifiedSop.sop.flows;

    // 2. Identify all session variables from the flows
    const variablesMap = new Map<string, string>();
    for (const flowSpec of Object.values(flows)) {
      const extractFromRoutes = (routes: any[]) => {
        if (!Array.isArray(routes)) return;
        routes.forEach(route => {
          if (route && Array.isArray(route.set_variables)) {
            route.set_variables.forEach((v: any) => {
              const isString = typeof v === 'string';
              const name = isString ? v : v?.name;
              const type = isString ? 'string' : v?.type || 'string';
              if (name) {
                variablesMap.set(name, type);
              }
            });
          }
        });
      };

      if (flowSpec.global_intent_routes) {
        extractFromRoutes(flowSpec.global_intent_routes);
      }
      if (flowSpec.nodes && Array.isArray(flowSpec.nodes)) {
        flowSpec.nodes.forEach((node: any) => {
          if (node.intent_routes) {
            extractFromRoutes(node.intent_routes);
          }
          if (node.actions && Array.isArray(node.actions)) {
            node.actions.forEach((act: any) => {
              if (act && act.store_result_variable) {
                variablesMap.set(act.store_result_variable, 'string');
              }
            });
          }
        });
      }
      if (flowSpec.input_variables && Array.isArray(flowSpec.input_variables)) {
        flowSpec.input_variables.forEach((v: any) => {
          const isString = typeof v === 'string';
          const name = isString ? v : v?.name;
          const type = isString ? 'string' : v?.type || 'string';
          if (name) {
            variablesMap.set(name, type);
          }
        });
      }
    }

    // 3. Identify all tools across all flows
    const toolsMap = new Map<string, { params: Set<string>; mockResponses: Record<string, any>; storeResultVariables: Set<string> }>();
    for (const flowSpec of Object.values(flows)) {
      if (flowSpec.nodes && Array.isArray(flowSpec.nodes)) {
        flowSpec.nodes.forEach((node: any) => {
          if (node.actions && Array.isArray(node.actions)) {
            node.actions.forEach((act: any) => {
              if (act.type === 'tool' && act.tool_name) {
                const toolName = act.tool_name;
                const params = act.tool_params ? Object.keys(act.tool_params) : [];
                const mockResponses = act.mock_responses || {};

                if (!toolsMap.has(toolName)) {
                  toolsMap.set(toolName, { params: new Set(), mockResponses: {}, storeResultVariables: new Set() });
                }
                const toolData = toolsMap.get(toolName)!;
                params.forEach(p => toolData.params.add(p));
                Object.assign(toolData.mockResponses, mockResponses);
                if (act.store_result_variable) {
                  toolData.storeResultVariables.add(act.store_result_variable);
                }
              }
            });
          }
        });
      }
    }

    // Add set_variables tool if variables exist
    if (variablesMap.size > 0) {
      const setVarsParams = new Set<string>();
      variablesMap.forEach((_, name) => {
        setVarsParams.add(`sop__${name}`);
      });
      toolsMap.set('set_variables', { params: setVarsParams, mockResponses: {}, storeResultVariables: new Set() });
    }

    // 4. Generate Python functions for all tools
    let pythonToolsCode = '';
    for (const [toolName, toolData] of toolsMap.entries()) {
      const paramsList = Array.from(toolData.params);
      const docstringArgs = paramsList.map(p => `        ${p}: Parameter for ${toolName}`).join('\n');

      if (toolName === 'set_variables') {
        const paramsSignature = paramsList.map(p => `${p}: Optional[Any] = None`).join(', ');
        const paramsAssign = paramsList.map(p => `    if ${p} is not None:\n        res["${p}"] = ${p}`).join('\n');
        pythonToolsCode += `def set_variables(${paramsSignature}) -> Dict[str, Any]:
    """Sets session variables for tracking workflow state.

    Args:
${docstringArgs}
    """
    res = {}
${paramsAssign}
    return res


`;
      } else {
        const paramsSignature = ['context: Context', ...paramsList.map(p => `${p}: Optional[Any] = None`)].join(', ');
        const storeVars = toolData.storeResultVariables ? Array.from(toolData.storeResultVariables) : [];
        const storeAssignments = storeVars.map(v => `    context.state["sop__${v}"] = result`).join('\n');
        const formattedMocks = await formatAsPythonDict(toolData.mockResponses, { indent: 2, baseIndent: 4 });

        pythonToolsCode += `def ${normalizePythonIdentifier(toolName)}(${paramsSignature}) -> Dict[str, Any]:
    """Mocked tool implementation for ${toolName}.

    Args:
${docstringArgs}
    """
    mock_responses = ${formattedMocks}
    journey = "default"
    try:
        if context and context.state:
            journey = context.state.get("ui__mock_journey", "default")
    except NameError:
        pass
    result = mock_responses.get(journey, list(mock_responses.values())[0] if mock_responses else {})
${storeAssignments}
    return result


`;
      }
    }

    // 5. Generate Agent definitions and identify transitions
    let pythonAgentsCode = '';
    const routingInstructions: string[] = [];

    for (const [flowId, flowSpec] of Object.entries(flows)) {
      const flowIdNormalized = normalizePythonIdentifier(flowId);
      const agentVar = `${flowIdNormalized}_agent`;

      routingInstructions.push(`- If the customer wants to perform tasks related to "${flowId}", transfer them to the sub-agent {@AGENT: ${flowIdNormalized}}.`);

      // Track tools used in this flow
      const flowToolsList = new Set<string>();
      if (variablesMap.size > 0) {
        // Assume set_variables might be used by any flow that updates variables
        flowToolsList.add('set_variables');
      }

      // Pre-calculate incoming transitions map for nodes in this flow
      const nodes = (flowSpec.nodes || []) as any[];
      const incomingMap = new Map<string, string[]>();
      nodes.forEach(n => {
        const addIncoming = (target: string, src: string) => {
          if (!incomingMap.has(target)) {
            incomingMap.set(target, []);
          }
          if (!incomingMap.get(target)!.includes(src)) {
            incomingMap.get(target)!.push(src);
          }
        };

        if (n.intent_routes && Array.isArray(n.intent_routes)) {
          n.intent_routes.forEach((r: any) => {
            if (r.target_node) addIncoming(r.target_node, n.id);
          });
        }
        if (n.condition_routes && Array.isArray(n.condition_routes)) {
          n.condition_routes.forEach((r: any) => {
            if (r.target_node) addIncoming(r.target_node, n.id);
          });
        }
      });

      let xmlSteps = '';
      nodes.forEach((node) => {
        if (!node.id) return;
        const stepId = node.id;
        const stepInstructions = node.agent_instructions || '';
        const mappedInstructions = mapVariableReferences(stepInstructions, variablesMap);

        let actionText = '';
        if (mappedInstructions.trim()) {
          actionText += `Instructions:\n` + mappedInstructions.trim().split('\n').map((line: string) => `- ${line.trim()}`).join('\n') + `\n\n`;
        } else if (stepId === 'END') {
          actionText += `Instructions:\n1. Send the last message to the customer.\n2. Terminate the conversation.\n\n`;
        }

        let toolText = '';
        if (node.actions && Array.isArray(node.actions)) {
          let hasTools = false;
          node.actions.forEach((act: any) => {
            if (act.type === 'tool' && act.tool_name) {
              if (!hasTools) {
                toolText += `Tool Executions:\n`;
                hasTools = true;
              }
              const toolName = act.tool_name;
              flowToolsList.add(toolName);

              const params = act.tool_params ? Object.keys(act.tool_params) : [];
              toolText += `- Call function \`${normalizePythonIdentifier(toolName)}\``;
              if (params.length > 0) {
                const mappedParams = params.map(p => variablesMap.has(p) ? `sop__${p}` : p);
                toolText += ` (parameters: ${mappedParams.join(', ')})`;
              } else {
                toolText += ` (no parameters)`;
              }
              if (act.store_result_variable) {
                toolText += `. The result will be automatically stored in the session variable \`sop__${act.store_result_variable}\`.\n`;
              } else {
                toolText += `. Wait for the tool response and use the returned data to determine the next response or transition.\n`;
              }
            }
          });
          if (hasTools) {
            toolText += '\n';
          }
        }
        actionText += toolText;

        let transitionText = '';
        if (node.intent_routes && Array.isArray(node.intent_routes)) {
          node.intent_routes.forEach((route: any) => {
            let routeDesc = `- If the customer's intent is "${route.intent}", `;
            if (route.target_flow) {
              const targetFlowNormalized = normalizePythonIdentifier(route.target_flow);
              routeDesc += `transfer the conversation to the specialized sub-agent {@AGENT: ${targetFlowNormalized}}`;
            } else if (route.target_node === 'END') {
              routeDesc += `terminate the conversation`;
            } else {
              routeDesc += `transition to step "${route.target_node}"`;
            }

            if (route.set_variables && Array.isArray(route.set_variables)) {
              routeDesc += ` and use \`set_variables\` to perform the following assignments:\n`;
              route.set_variables.forEach((v: any) => {
                const isString = typeof v === 'string';
                const name = isString ? v : v?.name;
                const type = isString ? 'string' : v?.type || 'string';
                let assignmentValue = `value based on customer choice (type: ${type})`;
                if (type.startsWith('enum[')) {
                  const options = type.substring(5, type.length - 1);
                  assignmentValue = `one of [${options}] based on customer choice`;
                }
                routeDesc += `  * \`sop__${name}\` = ${assignmentValue}\n`;
              });
            } else {
              routeDesc += `.\n`;
            }
            transitionText += routeDesc;
          });
        }

        if (node.condition_routes && Array.isArray(node.condition_routes)) {
          node.condition_routes.forEach((route: any) => {
            let routeDesc = '';
            const mappedCondition = mapVariableReferences(route.condition, variablesMap);
            if (route.condition === 'true') {
              routeDesc += `- Otherwise (default transition), `;
            } else {
              routeDesc += `- If condition "${mappedCondition}" is met, `;
            }

            if (route.target_flow) {
              const targetFlowNormalized = normalizePythonIdentifier(route.target_flow);
              routeDesc += `transfer the conversation to the specialized sub-agent {@AGENT: ${targetFlowNormalized}}.\n`;
            } else if (route.target_node === 'END') {
              routeDesc += `terminate the conversation.\n`;
            } else {
              routeDesc += `transition to step "${route.target_node}".\n`;
            }
            transitionText += routeDesc;
          });
        }

        if (transitionText) {
          actionText += `Transitions:\n${transitionText}`;
        }

        const isRoot = stepId === flowSpec.root_node_id;
        const incoming = incomingMap.get(stepId);
        const trigger = isRoot 
          ? `Upon entering this agent (the conversation context has just been transferred to you).`
          : incoming && incoming.length > 0
            ? `The conversation is routed to this step from [${incoming.map((s: string) => `'${s}'`).join(', ')}].`
            : `The conversation is routed to this step.`;

        xmlSteps += `    <step name="${stepId}">\n`;
        xmlSteps += `        <trigger>${trigger}</trigger>\n`;
        xmlSteps += `        <action>\n`;
        xmlSteps += `            ${actionText.trim().split('\n').join('\n            ')}\n`;
        xmlSteps += `        </action>\n`;
        xmlSteps += `    </step>\n\n`;
      });

      let sessionVariablesXml = '';
      if (variablesMap.size > 0) {
        sessionVariablesXml = '\n<session_variables>\n  The following session variables are active in this agent\'s scope:\n';
        variablesMap.forEach((type, name) => {
          sessionVariablesXml += `  - \`sop__${name}\` (type: ${type}): Session variable ${name} extracted from SOP intent routes.\n`;
        });
        sessionVariablesXml += '</session_variables>\n';
      }

      const instruction = `<role>You are the specialized agent for execution of ${flowId} SOP.</role>
<constraints>
  1. Only answer queries within the scope of this flow.
  2. If a tool needs to be called, call it first before replying.
  3. Evaluate conditions FIRST before checking user intents.
  4. If a step contains only conditions (state-based routing), you MUST evaluate the conditions immediately using the active session variables (sop__*) WITHOUT asking the user for additional input.
  5. Ensure session variables are updated whenever transitioning as instructed, using the \`set_variables\` tool.
</constraints>
${sessionVariablesXml}
<taskflow>
  <subtask name="execute-sop">
${xmlSteps.trimEnd()}  </subtask>
</taskflow>`;

      const escapedInstruction = instruction.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');
      const toolsList = Array.from(flowToolsList).map(normalizePythonIdentifier).join(', ');

      pythonAgentsCode += `${agentVar} = Agent(
    name="${normalizePythonIdentifier(flowId)}",
    model="gemini-3.5-flash",
    instruction="""${escapedInstruction}""",
    tools=[${toolsList}]
)


`;
    }

    const subAgentsList = Object.keys(flows)
      .map(flowId => `${normalizePythonIdentifier(flowId)}_agent`)
      .join(', ');

    const rootAgentInstruction = `<role>You are the main coordinator agent.</role>
<constraints>
  1. Transfer the conversation to the appropriate specialized agent based on the user's request.
  2. Do not attempt to fulfill specialized tasks yourself; delegate them immediately.
</constraints>

<taskflow>
  <subtask name="routing">
    <step name="route">
      <trigger>The customer greets you or asks for support.</trigger>
      <action>
        Greet the customer and ask how you can help.
        Based on their inquiry, delegate the conversation to the correct specialized subagent:
        ${routingInstructions.join('\n        ')}
      </action>
    </step>
  </subtask>
</taskflow>`;

    const escapedRootAgentInstruction = rootAgentInstruction.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');

    const mainAgentPython = `main_agent = Agent(
    name="main",
    model="gemini-3.5-flash",
    instruction="""${escapedRootAgentInstruction}""",
    sub_agents=[${subAgentsList}]
)
`;

    const workflowPython = `root_agent = main_agent\n`;

    const agentPyContent = `# filename: agent.py
from google.adk import Agent, Context
from typing import Dict, Any, Optional

# ==========================================
# 1. DEFINE MOCK PYTHON TOOLS
# ==========================================

${pythonToolsCode.trim()}


# ==========================================
# 2. DEFINE SPECIALIZED AGENTS
# ==========================================

${pythonAgentsCode.trim()}


# ==========================================
# 3. COMPILE INTO THE ORCHESTRATION GRAPH
# ==========================================

${mainAgentPython.trim()}

${workflowPython.trim()}
`;

    const agentName = projectName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
    const zipFolderName = `${agentName}__adk_fully_agentic`;
    // 6. Write manifest and code to ZIP
    const adkJson = JSON.stringify({
      name: zipFolderName,
      version: "1.0.0",
      description: `Agent Design Kit export (Fully Agentic) for ${projectName}`,
      entryPoint: "agent.py"
    }, null, 2);
    zip.addFile(`${zipFolderName}/adk.json`, Buffer.from(adkJson, 'utf-8'));
    zip.addFile(`${zipFolderName}/agent.py`, Buffer.from(agentPyContent, 'utf-8'));

    const adkBuffer = zip.toBuffer();

    return {
      data: adkBuffer,
      contentType: 'application/zip',
      filename: `${zipFolderName}.zip`
    };
  }
};

function findMainFlowDetails(folderPath: string, files: string[]): { mainFlowId: string; rootNodeId: string } {
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
      } catch (e) {
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
        } catch (e) {
          // ignore
        }
      }
    }
  }

  return { mainFlowId, rootNodeId };
}

