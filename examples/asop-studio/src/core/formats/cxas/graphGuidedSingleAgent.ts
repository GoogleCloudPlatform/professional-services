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
import { sanitizeResourceId } from './utils';
import { GUARDRAIL_ID, GUARDRAIL_DISPLAY_NAME, GUARDRAIL_DIR_NAME } from './constants';
import {
  buildGraphGuidedEvaluationJson,
  buildScenarioEvaluationJson,
  findMainFlowDetails
} from './evaluations';

export async function exportSingleAgentGraphGuided(
  context: CxasExportContext,
  agentDirName: string,
  files: string[]
): Promise<void> {
  const { folderPath, zip, projectName, variablesMap, toolsMap } = context;

  // 1. Resolve Graph Guided Blueprint Dir
  const ggBlueprintDir = getAssetsPath('src/core/assets/cxas_graph_guided_blueprint');
  if (!fs.existsSync(ggBlueprintDir)) {
    throw new Error(`Graph guided blueprint directory not found at ${ggBlueprintDir}`);
  }

  // 2. Load templates from Graph Guided Blueprint
  const appJsonTemplate = JSON.parse(fs.readFileSync(path.join(ggBlueprintDir, 'app.json'), 'utf-8'));
  const environmentJsonTemplate = JSON.parse(fs.readFileSync(path.join(ggBlueprintDir, 'environment.json'), 'utf-8'));
  const rootAgentJsonTemplate = JSON.parse(fs.readFileSync(path.join(ggBlueprintDir, 'agents/main/main.json'), 'utf-8'));
  const rootAgentInstructionTemplate = fs.readFileSync(path.join(ggBlueprintDir, 'agents/main/instruction.txt'), 'utf-8');
  const flowAgentJsonTemplate = JSON.parse(fs.readFileSync(path.join(ggBlueprintDir, 'agents/flow_agent/flow_agent.json'), 'utf-8'));
  const flowAgentInstruction = fs.readFileSync(path.join(ggBlueprintDir, 'agents/flow_agent/instruction.txt'), 'utf-8');

  const enterNodeJsonTemplate = JSON.parse(fs.readFileSync(path.join(ggBlueprintDir, 'tools/enter_node/enter_node.json'), 'utf-8'));
  const enterNodePythonCode = fs.readFileSync(path.join(ggBlueprintDir, 'tools/enter_node/python_function/python_code.py'), 'utf-8');

  // 3. Build unified SOP specification
  const sopSpec = buildUnifiedSop(projectName, folderPath);
  
  // Find main flow details (main flow ID and its root node ID)
  const { mainFlowId, rootNodeId } = findMainFlowDetails(folderPath, files);
  if (!mainFlowId || !rootNodeId) {
    throw new Error(`Could not determine main flow ID or root node ID for project ${projectName}`);
  }

  // 4. Extract business tools from nodes across all flows
  collectTools(folderPath, files, toolsMap);

  // 5. Generate dynamically-created start_flow tool
  const cleanProjectName = projectName.toLowerCase().replace(/[-]/g, '_');
  const startToolName = sanitizeResourceId(
    cleanProjectName.endsWith('_flow') 
      ? `start_${cleanProjectName}` 
      : `start_${cleanProjectName}_flow`
  );
  
  const startToolMetadata = {
    name: startToolName,
    pythonFunction: {
      name: startToolName,
      pythonCode: `tools/${startToolName}/python_function/python_code.py`,
      description: `Prepares required data for 'flow_agent' to run on ${projectName} flow. 1) This tool prepares data for 'flow_agent' and must be called before any handoff to 'flow_agent'. 2) 'flow_agent' should be invoked immediately and silently right after receiving this result, never before.`
    },
    executionType: "SYNCHRONOUS",
    displayName: startToolName
  };

  const strippedSopSpec = optimizeSopForRuntime(sopSpec);
  const formattedFlowSpec = await formatAsPythonDict(strippedSopSpec, { indent: 2, baseIndent: 0 });
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

FLOW_SPEC = ${formattedFlowSpec}

def ${startToolName}(params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Prepares required data for 'flow_agent' to run on ${projectName}. 1) This tool prepares data for 'flow_agent' and must be called before any handoff to 'flow_agent'. 2) 'flow_agent' should be invoked immediately and silently right after receiving this result, never before."""
    try:
        return start_flow_wrapped(params)
    except Exception as exc:
        return tool_exception(exc)

def start_flow_wrapped(params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
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

  // Write start flow tool to zip
  zip.addFile(`${agentDirName}/tools/${startToolName}/${startToolName}.json`, Buffer.from(JSON.stringify(startToolMetadata, null, 2), 'utf-8'));
  zip.addFile(`${agentDirName}/tools/${startToolName}/python_function/python_code.py`, Buffer.from(startToolPythonCode, 'utf-8'));

  // 6. Write enter_node tool to zip
  zip.addFile(`${agentDirName}/tools/enter_node/enter_node.json`, Buffer.from(JSON.stringify(enterNodeJsonTemplate, null, 2), 'utf-8'));
  zip.addFile(`${agentDirName}/tools/enter_node/python_function/python_code.py`, Buffer.from(enterNodePythonCode, 'utf-8'));

  // 7. Write all business tools (mocks generated via generateTools)
  await generateTools(context, agentDirName);

  // 8. Write flow_agent configuration
  const flowAgentTools = ['enter_node', 'end_session'];
  const flowAgentJson = {
    ...flowAgentJsonTemplate,
    tools: flowAgentTools
  };

  zip.addFile(`${agentDirName}/agents/flow_agent/flow_agent.json`, Buffer.from(JSON.stringify(flowAgentJson, null, 2), 'utf-8'));
  zip.addFile(`${agentDirName}/agents/flow_agent/instruction.txt`, Buffer.from(flowAgentInstruction, 'utf-8'));

  // 9. Write Coordinator Root Agent configuration
  const rootAgentJson = {
    ...rootAgentJsonTemplate,
    description: `${rootAgentJsonTemplate.description || ''} Automatically transitions to flow_agent using a beforeModelCallback.`.trim(),
    childAgents: ['flow_agent'],
    tools: [startToolName, 'end_session'],
    beforeModelCallbacks: [
      {
        pythonCode: `agents/main/before_model_callbacks/before_model_callbacks_01/python_code.py`,
        description: `Load the ${projectName} SOP and programmatically transition to flow_agent`
      }
    ]
  };

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

def before_model_callback(callback_context: CallbackContext, llm_request: LlmRequest) -> Optional[LlmResponse]:
    """Forces the execution of the ${projectName} SOP.
    
    This callback executes before the main agent model runs. It initializes the flow state
    using the start tool and immediately transitions control to the agnostic flow_agent.
    """
    # Setup flow execution: initialize variables and load flow spec
    tools.${startToolName}({})

    # Force handoff: perform an immediate and silent transfer to flow_agent
    return LlmResponse.from_parts(parts=[
        Part.from_agent_transfer(agent="flow_agent")
    ])
`;

  zip.addFile(`${agentDirName}/agents/main/before_model_callbacks/before_model_callbacks_01/python_code.py`, Buffer.from(beforeModelCallbackPythonCode, 'utf-8'));

  const routingInstructions = [
    `- Perform an IMMEDIATE and SILENT transfer to the sub-agent: {@AGENT: flow_agent} after invoking {@TOOL: ${startToolName}}`
  ];
  let rootAgentInstruction = rootAgentInstructionTemplate.replace(
    '{routing_instructions}',
    routingInstructions.join('\n        ')
  );
  rootAgentInstruction = rootAgentInstruction.replace(
    /{start_tool_name}/g,
    startToolName
  );
  rootAgentInstruction = `<!-- NOTE: a "Before LLM" callback will programmatically load and transition to the given SOP. These instructions are here for reference, but will never be executed. -->\n\n` + rootAgentInstruction;

  zip.addFile(`${agentDirName}/agents/main/main.json`, Buffer.from(JSON.stringify(rootAgentJson, null, 2), 'utf-8'));
  zip.addFile(`${agentDirName}/agents/main/instruction.txt`, Buffer.from(rootAgentInstruction, 'utf-8'));

  // 10. Write App & Environment configs
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
    } catch (e) {
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
    description: `CX Agent Studio export (Graph Guided) for ${projectName}`,
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

  // 11. Write Evaluations (Golden & Scenario Cases)
  const warnings: string[] = context.warnings || [];
  if (sopSpec.sop?.example_journeys && Array.isArray(sopSpec.sop.example_journeys)) {
    sopSpec.sop.example_journeys.forEach((journey: any) => {
      if (!journey.name || !journey.steps || !Array.isArray(journey.steps)) return;

      // Write Golden Case
      const goldenDisplayName = `Golden - ${journey.name}`;
      const sanitizedGoldenName = sanitizeResourceId(goldenDisplayName);
      const goldenEvalJson = buildGraphGuidedEvaluationJson(journey, sopSpec, mainFlowId, goldenDisplayName);
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

export function collectTools(
  folderPath: string,
  files: string[],
  toolsMap: Map<string, { params: Set<string>; mockResponses: Record<string, unknown>; storeResultVariables: Set<string> }>
): void {
  files.forEach(file => {
    if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      try {
        const fileContent = fs.readFileSync(path.join(folderPath, file), 'utf-8');
        const parsed = YAML.parse(fileContent);
        const flow = parsed?.flow;
        if (!flow) return;

        const nodes = flow.nodes || [];
        nodes.forEach((node: any) => {
          if (node.actions && Array.isArray(node.actions)) {
            node.actions.forEach((act: any) => {
              if (act.type === 'tool' && act.tool_name) {
                const toolName = act.tool_name;
                const params = act.tool_params ? Object.keys(act.tool_params) : [];
                const mockResponses = act.mock_responses || {};

                if (!toolsMap.has(toolName)) {
                  toolsMap.set(toolName, { params: new Set(), mockResponses: {}, storeResultVariables: new Set() });
                }
                const globalTool = toolsMap.get(toolName)!;
                params.forEach(p => globalTool.params.add(p));
                Object.assign(globalTool.mockResponses, mockResponses);
                if (act.store_result_variable) {
                  globalTool.storeResultVariables.add(act.store_result_variable);
                }
              }
            });
          }
        });
      } catch {
        // ignore
      }
    }
  });
}
