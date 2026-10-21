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
import type { CxasExportContext, ParsedSopFlow, SopNode } from './types';
import { mapVariableReferences, sanitizeResourceId } from './utils';

export function processSubflows(
  context: CxasExportContext,
  files: string[],
  agentDirName: string,
  mainFlowId?: string
): void {
  const { folderPath, zip, variablesMap, toolsMap, childAgents, routingInstructions } = context;

  let mainFlowData: {
    folderName: string;
    agentName: string;
    subagentInstruction: string;
    agentToolsList: Set<string>;
    flowId: string;
  } | null = null;

  files.forEach(file => {
    if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      const fileContent = fs.readFileSync(path.join(folderPath, file), 'utf-8');
      try {
        const parsed = YAML.parse(fileContent) as ParsedSopFlow | undefined;
        const flow = parsed?.flow;
        if (!flow) return;

        const flowId = flow.id || file.replace(/\.[^/.]+$/, "");
        const isMainFlow = mainFlowId && flowId.toLowerCase() === mainFlowId.toLowerCase();
        
        // Folder/File names and internal configurations use kebab-case directly
        const folderName = isMainFlow ? 'main' : sanitizeResourceId(flowId.toLowerCase());
        const agentName = isMainFlow ? 'root-agent' : folderName;

        if (!isMainFlow) {
          childAgents.push(folderName);
          routingInstructions.push(`- If the customer wants to perform tasks related to "${flowId}", transfer them to the child agent {@AGENT: ${folderName}} .`);
        }

        const agentToolsList = new Set<string>();
        agentToolsList.add('end_session');
        if (variablesMap.size > 0) {
          agentToolsList.add('set_variables');
        }

        // Process nodes to build instructions and gather tools
        const nodes = (flow.nodes || []) as Array<SopNode>;

        // Pre-calculate incoming transitions map for nodes in this flow
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
            n.intent_routes.forEach((r) => {
              if (r.target_node) addIncoming(r.target_node, n.id);
            });
          }
          if (n.condition_routes && Array.isArray(n.condition_routes)) {
            n.condition_routes.forEach((r) => {
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
            node.actions.forEach((act) => {
              if (act.type === 'tool' && act.tool_name) {
                if (!hasTools) {
                  toolText += `Tool Executions:\n`;
                  hasTools = true;
                }
                const toolName = act.tool_name;
                const toolFolderName = sanitizeResourceId(toolName.toLowerCase());
                
                agentToolsList.add(toolFolderName);

                // Extract params and mock response
                const params = act.tool_params ? Object.keys(act.tool_params) : [];
                const mockResponses = act.mock_responses || {};

                // Register tool globally
                if (!toolsMap.has(toolName)) {
                  toolsMap.set(toolName, { params: new Set(), mockResponses: {}, storeResultVariables: new Set() });
                }
                const globalTool = toolsMap.get(toolName)!;
                params.forEach(p => globalTool.params.add(p));
                Object.assign(globalTool.mockResponses, mockResponses);
                if (act.store_result_variable) {
                  globalTool.storeResultVariables.add(act.store_result_variable);
                }

                toolText += `- Execute the tool {@TOOL: ${toolFolderName}}`;
                if (params.length > 0) {
                  const mappedParams = params.map(p => variablesMap.has(p) ? `{sop__${p}}` : p);
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
            node.intent_routes.forEach((route) => {
              let routeDesc = `- If the customer's intent is "${route.intent}", `;
              if (route.target_flow) {
                const targetFlowName = route.target_flow.toLowerCase().replace(/\.[^/.]+$/, "");
                const isTargetMain = targetFlowName === 'main' || (mainFlowId && targetFlowName === mainFlowId.toLowerCase());
                const targetAgentFolder = isTargetMain ? 'main' : sanitizeResourceId(targetFlowName);
                routeDesc += `transfer the conversation to the specialized child agent {@AGENT: ${targetAgentFolder}}`;
              } else if (route.target_node === 'END') {
                routeDesc += `terminate the conversation`;
              } else {
                routeDesc += `transition to step "${route.target_node}"`;
              }

              if (route.set_variables && Array.isArray(route.set_variables)) {
                routeDesc += ` and use {@TOOL: set_variables} to perform the following assignments:\n`;
                route.set_variables.forEach((v) => {
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
            node.condition_routes.forEach((route) => {
              let routeDesc = '';
              const mappedCondition = mapVariableReferences(route.condition, variablesMap);
              if (route.condition === 'true') {
                routeDesc += `- Otherwise (default transition), `;
              } else {
                routeDesc += `- If condition "${mappedCondition}" is met, `;
              }

              if (route.target_flow) {
                const targetFlowName = route.target_flow.toLowerCase().replace(/\.[^/.]+$/, "");
                const isTargetMain = targetFlowName === 'main' || (mainFlowId && targetFlowName === mainFlowId.toLowerCase());
                const targetAgentFolder = isTargetMain ? 'main' : sanitizeResourceId(targetFlowName);
                routeDesc += `transfer the conversation to the specialized child agent {@AGENT: ${targetAgentFolder}}.\n`;
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

          const isRoot = stepId === flow.root_node_id;
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

        // Build Session Variables XML
        let sessionVariablesXml = '';
        if (variablesMap.size > 0) {
          sessionVariablesXml = '\n<session_variables>\n  The following session variables are active in this agent\'s scope:\n';
          variablesMap.forEach((type, name) => {
            sessionVariablesXml += `  - \`sop__${name}\` (type: ${type}): Session variable ${name} extracted from SOP intent routes.\n`;
          });
          sessionVariablesXml += '</session_variables>\n';
        }

        // Build Instruction.txt
        const subagentInstruction = `<role>You are the specialized agent for execution of ${flowId} SOP.</role>
<constraints>
  1. Only answer queries within the scope of this flow.
  2. If a tool needs to be called, call it first before replying.
  3. Evaluate conditions FIRST before checking user intents.
  4. If a step contains only conditions (state-based routing), you MUST evaluate the conditions immediately using the active session variables ({sop__*}) WITHOUT asking the user for additional input.
  5. Ensure session variables are updated whenever transitioning as instructed, using the {@TOOL: set_variables} tool.
</constraints>
${sessionVariablesXml}
<taskflow>
  <subtask name="execute-sop">
${xmlSteps.trimEnd()}  </subtask>
</taskflow>
`;

        if (isMainFlow) {
          mainFlowData = {
            folderName,
            agentName,
            subagentInstruction,
            agentToolsList,
            flowId
          };
        } else {
          const agentMetadata = {
            name: agentName,
            displayName: folderName,
            description: `Flow agent for ${flowId}`,
            instruction: `agents/${folderName}/instruction.txt`,
            tools: Array.from(agentToolsList)
          };

          zip.addFile(`${agentDirName}/agents/${folderName}/${folderName}.json`, Buffer.from(JSON.stringify(agentMetadata, null, 2), 'utf-8'));
          zip.addFile(`${agentDirName}/agents/${folderName}/instruction.txt`, Buffer.from(subagentInstruction, 'utf-8'));
        }
      } catch {
        // Ignore parse errors or continue
      }
    }
  });

  // Now write the main agent files if found
  if (mainFlowData) {
    const { folderName, agentName, subagentInstruction, agentToolsList, flowId } = mainFlowData;
    
    // For the main agent, the child agents are all other agents processed so far
    const agentMetadata = {
      name: agentName,
      displayName: 'main',
      description: `Flow agent for ${flowId}`,
      instruction: `agents/${folderName}/instruction.txt`,
      childAgents: childAgents,
      tools: Array.from(agentToolsList)
    };

    zip.addFile(`${agentDirName}/agents/${folderName}/${folderName}.json`, Buffer.from(JSON.stringify(agentMetadata, null, 2), 'utf-8'));
    zip.addFile(`${agentDirName}/agents/${folderName}/instruction.txt`, Buffer.from(subagentInstruction, 'utf-8'));
  }
}
