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
import AdmZip from 'adm-zip';
import os from 'os';
import { cxasFormat } from './index';
import { sanitizeResourceId } from './utils';
import { collectSopTools, type SopToolInfo } from './tools_helper';
import { extractVariables } from './variables';

export interface MountOptions {
  sourceSopDir: string;
  targetDir: string;
  subagentName: string;
  engine: 'fully-agentic' | 'graph-guided';
  prefix: string;
  agent?: boolean;
  globalInstructions?: boolean;
  promptGuard?: boolean;
  goldenEvals?: boolean;
  scenarioEvals?: boolean;
}

export async function mountSubagent(options: MountOptions): Promise<void> {
  const { sourceSopDir, targetDir, subagentName, engine, prefix } = options;

  const hasAnySelector = Boolean(
    options.agent ||
    options.globalInstructions ||
    options.promptGuard ||
    options.goldenEvals ||
    options.scenarioEvals
  );

  const mountAgent = hasAnySelector ? Boolean(options.agent) : true;
  const mountGlobalInstructions = hasAnySelector ? Boolean(options.globalInstructions) : true;
  const mountPromptGuard = hasAnySelector ? Boolean(options.promptGuard) : true;
  const mountGoldenEvals = hasAnySelector ? Boolean(options.goldenEvals) : true;
  const mountScenarioEvals = hasAnySelector ? Boolean(options.scenarioEvals) : true;

  // 1. Extract variables from source to type-check parameters
  const files = fs.readdirSync(sourceSopDir);
  const variablesMap = extractVariables(sourceSopDir, files);

  // 2. Collect all tools used in the SOP
  const sopTools = collectSopTools(sourceSopDir, files, variablesMap);

  if (mountAgent) {
    // 3. Perform tools consistency check (including types and return annotations)
    verifyToolsConsistency(sopTools, targetDir);

    // 4. Sanitize target tools to ensure valid displayName and executionType metadata
    sanitizeTargetTools(sopTools, targetDir);
  }

  // 5. Create a temporary folder to hold the exported CXAS agent for the SOP
  const tempExportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asop-mount-export-'));
  try {
    const exportResult = await cxasFormat.export!({
      projectName: subagentName,
      folderPath: sourceSopDir,
      mode: engine
    });

    const zip = new AdmZip(exportResult.data);
    zip.extractAllTo(tempExportDir, true);

    const generatedAgentName = sanitizeResourceId(subagentName.toLowerCase());
    const generatedAgentDir = path.join(tempExportDir, generatedAgentName);

    if (mountAgent) {
      // 6. Merge variable declarations
      mergeVariableDeclarations(generatedAgentDir, targetDir);

      // 9. Mount sub-agent files and nested child agents
      mountAgentFiles(generatedAgentDir, targetDir, subagentName, engine, prefix);

      // 10. Register the subagent in the target's root agent
      registerInRootAgent(targetDir, subagentName);

      // 11. Copy framework tools
      copyFrameworkTools(generatedAgentDir, targetDir, subagentName, engine, prefix);
    }

    if (mountGlobalInstructions) {
      // 7. Overwrite global instructions
      overwriteGlobalInstructions(generatedAgentDir, targetDir);
    }

    if (mountPromptGuard) {
      // 8. Overwrite prompt guardrail
      overwritePromptGuard(generatedAgentDir, targetDir);
    }

    if (mountGoldenEvals || mountScenarioEvals) {
      // 12. Copy evaluations
      copyEvaluations(generatedAgentDir, targetDir, prefix, mountGoldenEvals, mountScenarioEvals);
    }

  } finally {
    try {
      if (fs.existsSync(tempExportDir)) {
        fs.rmSync(tempExportDir, { recursive: true, force: true });
      }
    } catch (e) {
      // ignore
    }
  }
}

function verifyToolsConsistency(sopTools: Map<string, SopToolInfo>, targetDir: string): void {
  const missingTools: string[] = [];
  const untypedErrors: string[] = [];
  const missingReturnErrors: string[] = [];
  const typeIncompatibilities: string[] = [];
  const missingParamErrors: string[] = [];

  for (const [toolName, sopTool] of sopTools.entries()) {
    const sanitized = sanitizeResourceId(toolName.toLowerCase());
    if (['end_session', 'set_variables', 'enter_node'].includes(sanitized) || sanitized.startsWith('start_')) {
      continue;
    }

    const toolJsonPath = path.join(targetDir, 'tools', sanitized, `${sanitized}.json`);
    if (!fs.existsSync(toolJsonPath)) {
      missingTools.push(toolName);
      continue;
    }

    // Tool exists, check signature compatibility
    try {
      const toolMetadata = JSON.parse(fs.readFileSync(toolJsonPath, 'utf-8'));
      const pythonCodePath = toolMetadata?.pythonFunction?.pythonCode;
      if (!pythonCodePath) {
        continue;
      }
      const absolutePythonPath = path.resolve(targetDir, pythonCodePath);
      if (!fs.existsSync(absolutePythonPath)) {
        missingTools.push(`${toolName} (python function file missing)`);
        continue;
      }

      const pythonCode = fs.readFileSync(absolutePythonPath, 'utf-8');
      const pythonFuncName = toolMetadata.pythonFunction.name || toolName;

      // Match python def func_name(args) -> return_type:
      const funcRegex = new RegExp(`def\\s+${pythonFuncName}\\s*\\(([\\s\\S]*?)\\)\\s*(?:->\\s*([a-zA-Z0-9_\\[\\].,\\s]+))?\\s*:`);
      const match = funcRegex.exec(pythonCode);
      if (!match) {
        missingParamErrors.push(`Could not parse Python function signature for tool "${toolName}"`);
        continue;
      }

      const paramsString = match[1];
      const returnType = match[2]?.trim();

      if (!returnType) {
        missingReturnErrors.push(`Python function "${pythonFuncName}" is missing a return type annotation. Python functions must be explicitly annotated with a json-serializable return type.`);
      }

      const parsedParams = paramsString.split(',').map(p => p.trim()).filter(Boolean);
      let hasKwargs = false;
      const targetParams = new Map<string, string>(); // paramName -> typeAnnotation
      const untypedParams: string[] = [];

      for (const param of parsedParams) {
        if (param.startsWith('**')) {
          hasKwargs = true;
        } else if (param.startsWith('*')) {
          // ignore *args
        } else {
          const parts = param.split(':');
          const namePart = parts[0].split('=')[0].trim();
          if (parts.length < 2) {
            untypedParams.push(namePart);
          } else {
            const typePart = parts[1].split('=')[0].trim();
            targetParams.set(namePart, typePart);
          }
        }
      }

      if (untypedParams.length > 0) {
        untypedErrors.push(`Python function "${pythonFuncName}" has parameters without types: [${untypedParams.join(', ')}]. All parameters must have explicit non-void, json-serializable type annotations.`);
      }

      if (!hasKwargs) {
        for (const [paramName, sopParam] of sopTool.params.entries()) {
          if (!targetParams.has(paramName)) {
            missingParamErrors.push(`Tool "${toolName}" is missing parameter "${paramName}".`);
          } else {
            const targetType = targetParams.get(paramName)!;
            if (!isTypeCompatible(sopParam.type, targetType)) {
              typeIncompatibilities.push(`Tool "${toolName}" parameter "${paramName}" expects type compatible with "${sopParam.type}", but target defines it as "${targetType}".`);
            }
          }
        }
      }
    } catch (e: any) {
      missingParamErrors.push(`Failed to parse tool "${toolName}": ${e.message}`);
    }
  }

  if (
    missingTools.length > 0 ||
    untypedErrors.length > 0 ||
    missingReturnErrors.length > 0 ||
    typeIncompatibilities.length > 0 ||
    missingParamErrors.length > 0
  ) {
    let errorMsg = 'Tools consistency check failed:\n';
    if (missingTools.length > 0) {
      errorMsg += `  Missing tools in target agent: ${missingTools.join(', ')}\n`;
    }
    if (untypedErrors.length > 0) {
      errorMsg += `  Untyped parameters:\n    - ${untypedErrors.join('\n    - ')}\n`;
    }
    if (missingReturnErrors.length > 0) {
      errorMsg += `  Missing return type annotations:\n    - ${missingReturnErrors.join('\n    - ')}\n`;
    }
    if (missingParamErrors.length > 0) {
      errorMsg += `  Missing parameters/signatures:\n    - ${missingParamErrors.join('\n    - ')}\n`;
    }
    if (typeIncompatibilities.length > 0) {
      errorMsg += `  Type incompatibilities:\n    - ${typeIncompatibilities.join('\n    - ')}\n`;
    }
    throw new Error(errorMsg);
  }
}

function isTypeCompatible(expectedType: string, targetType: string): boolean {
  const targetLower = targetType.toLowerCase();
  if (targetLower.includes('any')) {
    return true;
  }
  if (expectedType === 'STRING') {
    return targetLower.includes('str') || targetLower.includes('string');
  }
  if (expectedType === 'BOOLEAN') {
    return targetLower.includes('bool') || targetLower.includes('boolean');
  }
  if (expectedType === 'NUMBER') {
    return targetLower.includes('int') || targetLower.includes('float') || targetLower.includes('num') || targetLower.includes('number');
  }
  return false;
}

function sanitizeTargetTools(sopTools: Map<string, SopToolInfo>, targetDir: string): void {
  for (const [toolName] of sopTools.entries()) {
    const sanitized = sanitizeResourceId(toolName.toLowerCase());
    if (['end_session', 'set_variables', 'enter_node'].includes(sanitized) || sanitized.startsWith('start_')) {
      continue;
    }

    const toolJsonPath = path.join(targetDir, 'tools', sanitized, `${sanitized}.json`);
    if (fs.existsSync(toolJsonPath)) {
      try {
        const toolMetadata = JSON.parse(fs.readFileSync(toolJsonPath, 'utf-8'));
        let changed = false;
        if (!toolMetadata.displayName) {
          toolMetadata.displayName = toolName;
          changed = true;
        }
        if (!toolMetadata.executionType) {
          toolMetadata.executionType = 'SYNCHRONOUS';
          changed = true;
        }
        if (changed) {
          fs.writeFileSync(toolJsonPath, JSON.stringify(toolMetadata, null, 2), 'utf-8');
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

function mergeVariableDeclarations(sourceDir: string, targetDir: string): void {
  const sourceAppJsonPath = path.join(sourceDir, 'app.json');
  const targetAppJsonPath = path.join(targetDir, 'app.json');

  if (!fs.existsSync(sourceAppJsonPath) || !fs.existsSync(targetAppJsonPath)) return;

  const sourceApp = JSON.parse(fs.readFileSync(sourceAppJsonPath, 'utf-8'));
  const targetApp = JSON.parse(fs.readFileSync(targetAppJsonPath, 'utf-8'));

  const sourceVars = sourceApp.variableDeclarations || [];
  const targetVars = targetApp.variableDeclarations || [];

  const mergedVars = [...targetVars];

  for (const sVar of sourceVars) {
    const existingIndex = mergedVars.findIndex((v: any) => v.name === sVar.name);
    if (existingIndex >= 0) {
      mergedVars[existingIndex] = sVar; // overwrite with source
    } else {
      mergedVars.push(sVar);
    }
  }

  targetApp.variableDeclarations = mergedVars;
  fs.writeFileSync(targetAppJsonPath, JSON.stringify(targetApp, null, 2), 'utf-8');
}

function overwriteGlobalInstructions(sourceDir: string, targetDir: string): void {
  const sourceAppJsonPath = path.join(sourceDir, 'app.json');
  const targetAppJsonPath = path.join(targetDir, 'app.json');

  if (!fs.existsSync(sourceAppJsonPath) || !fs.existsSync(targetAppJsonPath)) return;

  const sourceApp = JSON.parse(fs.readFileSync(sourceAppJsonPath, 'utf-8'));
  const targetApp = JSON.parse(fs.readFileSync(targetAppJsonPath, 'utf-8'));

  if (sourceApp.globalInstruction) {
    const sourceGlobalInstFile = path.join(sourceDir, sourceApp.globalInstruction);
    if (fs.existsSync(sourceGlobalInstFile)) {
      const targetGlobalInstFile = path.join(targetDir, 'global_instruction.txt');
      fs.copyFileSync(sourceGlobalInstFile, targetGlobalInstFile);
      targetApp.globalInstruction = 'global_instruction.txt';
    }
  } else {
    delete targetApp.globalInstruction;
    const targetGlobalInstFile = path.join(targetDir, 'global_instruction.txt');
    if (fs.existsSync(targetGlobalInstFile)) {
      fs.unlinkSync(targetGlobalInstFile);
    }
  }

  fs.writeFileSync(targetAppJsonPath, JSON.stringify(targetApp, null, 2), 'utf-8');
}

function overwritePromptGuard(sourceDir: string, targetDir: string): void {
  const sourceAppJsonPath = path.join(sourceDir, 'app.json');
  const targetAppJsonPath = path.join(targetDir, 'app.json');

  if (!fs.existsSync(sourceAppJsonPath) || !fs.existsSync(targetAppJsonPath)) return;

  const targetApp = JSON.parse(fs.readFileSync(targetAppJsonPath, 'utf-8'));

  const GUARDRAIL_DISPLAY_NAME = 'ASOP Prompt Guardrail';
  const GUARDRAIL_DIR_NAME = 'asop_prompt_guardrail';

  // Ensure guardrails array exists
  let targetGuardrails: string[] = targetApp.guardrails || [];
  targetGuardrails = targetGuardrails.filter(
    g => g !== 'Default Prompt Guardrail' && g !== GUARDRAIL_DISPLAY_NAME
  );

  const sourceGuardrailDir = path.join(sourceDir, 'guardrails', GUARDRAIL_DIR_NAME);
  if (fs.existsSync(sourceGuardrailDir)) {
    const targetGuardrailDir = path.join(targetDir, 'guardrails', GUARDRAIL_DIR_NAME);
    fs.mkdirSync(targetGuardrailDir, { recursive: true });
    
    // Copy all files in the guardrail folder
    fs.readdirSync(sourceGuardrailDir).forEach(file => {
      fs.copyFileSync(
        path.join(sourceGuardrailDir, file),
        path.join(targetGuardrailDir, file)
      );
    });

    targetGuardrails.push(GUARDRAIL_DISPLAY_NAME);
  } else {
    // Delete target guardrail folder if exists
    const targetGuardrailDir = path.join(targetDir, 'guardrails', GUARDRAIL_DIR_NAME);
    if (fs.existsSync(targetGuardrailDir)) {
      fs.rmSync(targetGuardrailDir, { recursive: true, force: true });
    }
  }

  // Delete Default Prompt Guardrail folder if exists
  const defaultPromptGuardrailDir = path.join(targetDir, 'guardrails', 'Default_Prompt_Guardrail');
  if (fs.existsSync(defaultPromptGuardrailDir)) {
    fs.rmSync(defaultPromptGuardrailDir, { recursive: true, force: true });
  }

  if (targetGuardrails.length > 0) {
    targetApp.guardrails = targetGuardrails;
  } else {
    delete targetApp.guardrails;
  }

  fs.writeFileSync(targetAppJsonPath, JSON.stringify(targetApp, null, 2), 'utf-8');
}

function mountAgentFiles(
  sourceDir: string,
  targetDir: string,
  subagentName: string,
  _engine: 'fully-agentic' | 'graph-guided',
  prefix: string
): void {
  const sanitizedSubagentName = sanitizeResourceId(subagentName.toLowerCase());
  const targetSubagentDir = path.join(targetDir, 'agents', sanitizedSubagentName);

  // Clean existing subagent folder if any
  if (fs.existsSync(targetSubagentDir)) {
    fs.rmSync(targetSubagentDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetSubagentDir, { recursive: true });

  // 1. Copy the source main agent files to the target subagent directory
  const sourceMainDir = path.join(sourceDir, 'agents', 'main');
  if (!fs.existsSync(sourceMainDir)) {
    throw new Error('Could not find main agent in source export.');
  }

  // Copy instruction.txt
  const sourceInstructionFile = path.join(sourceMainDir, 'instruction.txt');
  const targetInstructionFile = path.join(targetSubagentDir, 'instruction.txt');
  if (fs.existsSync(sourceInstructionFile)) {
    let instructions = fs.readFileSync(sourceInstructionFile, 'utf-8');
    // Replace references to other child agents with prefix
    if (prefix) {
      // replace {@AGENT: name} with {@AGENT: prefixname}
      instructions = instructions.replace(/\{@AGENT:\s*([a-zA-Z0-9-_]+)\}/g, (_match, agentId) => {
        if (agentId === 'main' || agentId === 'root-agent') {
          return `{@AGENT: ${sanitizedSubagentName}}`;
        }
        return `{@AGENT: ${prefix}${agentId}}`;
      });
      instructions = instructions.replace(/\{@TOOL:\s*([a-zA-Z0-9-_]+)\}/g, (match, toolId) => {
        if (toolId === 'end_session' || toolId === 'set_variables' || toolId === 'enter_node') {
          return `{@TOOL: ${prefix}${toolId}}`;
        }
        if (toolId.startsWith('start_')) {
          return `{@TOOL: ${prefix}${toolId}}`;
        }
        return match; // keep business tools untouched
      });
    } else {
      instructions = instructions.replace(/\{@AGENT:\s*(main|root-agent)\}/g, `{@AGENT: ${sanitizedSubagentName}}`);
    }
    fs.writeFileSync(targetInstructionFile, instructions, 'utf-8');
  }

  // Copy and update JSON metadata
  const sourceJsonFile = path.join(sourceMainDir, 'main.json');
  const targetJsonFile = path.join(targetSubagentDir, `${sanitizedSubagentName}.json`);
  if (fs.existsSync(sourceJsonFile)) {
    const metadata = JSON.parse(fs.readFileSync(sourceJsonFile, 'utf-8'));
    metadata.name = sanitizedSubagentName;
    metadata.displayName = sanitizedSubagentName; // Use sanitizedSubagentName as name and displayName for consistency
    metadata.instruction = `agents/${sanitizedSubagentName}/instruction.txt`;

    if (metadata.childAgents) {
      metadata.childAgents = metadata.childAgents.map((c: string) => {
        return prefix ? `${prefix}${c}` : c;
      });
    }

    if (metadata.tools) {
      metadata.tools = metadata.tools.map((t: string) => {
        if (prefix && (t === 'set_variables' || t === 'enter_node' || t.endsWith('_enter_node') || t.startsWith('start_'))) {
          return `${prefix}${t}`;
        }
        return t;
      });
    }

    // Update beforeModelCallbacks if they exist
    if (metadata.beforeModelCallbacks && Array.isArray(metadata.beforeModelCallbacks)) {
      metadata.beforeModelCallbacks.forEach((cb: any, index: number) => {
        const callbackSrcFile = path.join(sourceMainDir, cb.pythonCode.replace('agents/main/', ''));
        const cbIndexStr = String(index + 1).padStart(2, '0');
        const targetCallbackRelPath = `agents/${sanitizedSubagentName}/before_model_callbacks/before_model_callbacks_${cbIndexStr}/python_code.py`;
        const callbackDestFile = path.join(targetDir, targetCallbackRelPath);

        fs.mkdirSync(path.dirname(callbackDestFile), { recursive: true });

        if (fs.existsSync(callbackSrcFile)) {
          let code = fs.readFileSync(callbackSrcFile, 'utf-8');
          // Replace flow_agent or start tools with prefixed names
          if (prefix) {
            code = code.replace(/Part\.from_agent_transfer\(agent=["']flow_agent["']\)/g, `Part.from_agent_transfer(agent="${prefix}flow_agent")`);
            code = code.replace(/tools\.start_([a-zA-Z0-9-_]+)\(/g, (_match, flowName) => {
              return `tools.${prefix}start_${flowName}(`;
            });
            code = code.replace(/ENTER_NODE_TOOL = ["']([a-zA-Z0-9-_]+)["']/g, (_match, toolName) => {
              return `ENTER_NODE_TOOL = "${prefix}${toolName}"`;
            });
          }
          fs.writeFileSync(callbackDestFile, code, 'utf-8');
        }

        cb.pythonCode = targetCallbackRelPath;
      });
    }

    // Update afterModelCallbacks if they exist
    if (metadata.afterModelCallbacks && Array.isArray(metadata.afterModelCallbacks)) {
      metadata.afterModelCallbacks.forEach((cb: any, index: number) => {
        const callbackSrcFile = path.join(sourceMainDir, cb.pythonCode.replace('agents/main/', ''));
        const cbIndexStr = String(index + 1).padStart(2, '0');
        const targetCallbackRelPath = `agents/${sanitizedSubagentName}/after_model_callbacks/after_model_callbacks_${cbIndexStr}/python_code.py`;
        const callbackDestFile = path.join(targetDir, targetCallbackRelPath);

        fs.mkdirSync(path.dirname(callbackDestFile), { recursive: true });

        if (fs.existsSync(callbackSrcFile)) {
          let code = fs.readFileSync(callbackSrcFile, 'utf-8');
          fs.writeFileSync(callbackDestFile, code, 'utf-8');
        }

        cb.pythonCode = targetCallbackRelPath;
      });
    }

    fs.writeFileSync(targetJsonFile, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  // 2. Copy other child agents in source agents/ directory
  const sourceAgentsDir = path.join(sourceDir, 'agents');
  fs.readdirSync(sourceAgentsDir).forEach(item => {
    if (item === 'main') return;

    const sourceChildDir = path.join(sourceAgentsDir, item);
    if (!fs.statSync(sourceChildDir).isDirectory()) return;

    const targetChildName = prefix ? `${prefix}${item}` : item;
    const targetChildDir = path.join(targetDir, 'agents', targetChildName);

    if (fs.existsSync(targetChildDir)) {
      fs.rmSync(targetChildDir, { recursive: true, force: true });
    }
    fs.mkdirSync(targetChildDir, { recursive: true });

    // Copy files
    fs.readdirSync(sourceChildDir).forEach(file => {
      const srcFile = path.join(sourceChildDir, file);
      const destFile = path.join(targetChildDir, file.replace(item, targetChildName));

      if (file.endsWith('.json')) {
        const metadata = JSON.parse(fs.readFileSync(srcFile, 'utf-8'));
        metadata.name = targetChildName;
        metadata.displayName = targetChildName;
        metadata.instruction = `agents/${targetChildName}/instruction.txt`;
        if (metadata.childAgents) {
          metadata.childAgents = metadata.childAgents.map((c: string) => prefix ? `${prefix}${c}` : c);
        }
        if (metadata.tools) {
          metadata.tools = metadata.tools.map((t: string) => {
            if (prefix && (t === 'set_variables' || t === 'enter_node' || t.endsWith('_enter_node') || t.startsWith('start_'))) {
              return `${prefix}${t}`;
            }
            return t;
          });
        }
        if (metadata.afterModelCallbacks && Array.isArray(metadata.afterModelCallbacks)) {
          metadata.afterModelCallbacks.forEach((cb: any, index: number) => {
            const cbIndexStr = String(index + 1).padStart(2, '0');
            cb.pythonCode = `agents/${targetChildName}/after_model_callbacks/after_model_callbacks_${cbIndexStr}/python_code.py`;
          });
        }
        if (metadata.beforeModelCallbacks && Array.isArray(metadata.beforeModelCallbacks)) {
          metadata.beforeModelCallbacks.forEach((cb: any, index: number) => {
            const cbIndexStr = String(index + 1).padStart(2, '0');
            cb.pythonCode = `agents/${targetChildName}/before_model_callbacks/before_model_callbacks_${cbIndexStr}/python_code.py`;
          });
        }
        fs.writeFileSync(destFile, JSON.stringify(metadata, null, 2), 'utf-8');
      } else if (file === 'instruction.txt') {
        let instructions = fs.readFileSync(srcFile, 'utf-8');
        if (prefix) {
          instructions = instructions.replace(/\{@AGENT:\s*([a-zA-Z0-9-_]+)\}/g, (_match, agentId) => {
            if (agentId === 'main' || agentId === 'root-agent') {
              return `{@AGENT: ${sanitizedSubagentName}}`;
            }
            return `{@AGENT: ${prefix}${agentId}}`;
          });
          instructions = instructions.replace(/\{@TOOL:\s*([a-zA-Z0-9-_]+)\}/g, (match, toolId) => {
            if (toolId === 'end_session' || toolId === 'set_variables' || toolId === 'enter_node' || toolId.endsWith('_enter_node')) {
              return `{@TOOL: ${prefix}${toolId}}`;
            }
            if (toolId.startsWith('start_')) {
              return `{@TOOL: ${prefix}${toolId}}`;
            }
            return match;
          });
        }
        fs.writeFileSync(destFile, instructions, 'utf-8');
      } else {
        // Just copy other files directly (recursively if directories)
        fs.cpSync(srcFile, destFile, { recursive: true });
        if (prefix && fs.statSync(destFile).isDirectory()) {
          const patchPyFiles = (dir: string) => {
            fs.readdirSync(dir).forEach(child => {
              const fullChild = path.join(dir, child);
              if (fs.statSync(fullChild).isDirectory()) {
                patchPyFiles(fullChild);
              } else if (child.endsWith('.py')) {
                let code = fs.readFileSync(fullChild, 'utf-8');
                code = code.replace(/ENTER_NODE_TOOL = ["']([a-zA-Z0-9-_]+)["']/g, (_match, toolName) => {
                  return `ENTER_NODE_TOOL = "${prefix}${toolName}"`;
                });
                fs.writeFileSync(fullChild, code, 'utf-8');
              }
            });
          };
          patchPyFiles(destFile);
        }
      }
    });
  });
}

function registerInRootAgent(targetDir: string, subagentName: string): void {
  const targetAppJsonPath = path.join(targetDir, 'app.json');
  if (!fs.existsSync(targetAppJsonPath)) return;

  const targetApp = JSON.parse(fs.readFileSync(targetAppJsonPath, 'utf-8'));
  const rootAgentName = targetApp.rootAgent;
  if (!rootAgentName) return;

  // Search for the root agent JSON file under agents/
  const agentsDir = path.join(targetDir, 'agents');
  let rootAgentJsonPath = '';

  fs.readdirSync(agentsDir).forEach(folder => {
    const folderPath = path.join(agentsDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) return;

    const possibleJson = path.join(folderPath, `${folder}.json`);
    if (fs.existsSync(possibleJson)) {
      const metadata = JSON.parse(fs.readFileSync(possibleJson, 'utf-8'));
      if (metadata.displayName === rootAgentName || metadata.name === rootAgentName) {
        rootAgentJsonPath = possibleJson;
      }
    }
  });

  if (!rootAgentJsonPath) {
    throw new Error(`Could not locate root agent with displayName: "${rootAgentName}" in target agents folder.`);
  }

  const rootMetadata = JSON.parse(fs.readFileSync(rootAgentJsonPath, 'utf-8'));
  const childAgents = rootMetadata.childAgents || [];
  const sanitizedSubagentName = sanitizeResourceId(subagentName.toLowerCase());

  if (!childAgents.includes(sanitizedSubagentName)) {
    childAgents.push(sanitizedSubagentName);
  }

  rootMetadata.childAgents = childAgents;
  fs.writeFileSync(rootAgentJsonPath, JSON.stringify(rootMetadata, null, 2), 'utf-8');
}

function copyFrameworkTools(
  sourceDir: string,
  targetDir: string,
  _subagentName: string,
  _engine: 'fully-agentic' | 'graph-guided',
  prefix: string
): void {
  const sourceToolsDir = path.join(sourceDir, 'tools');
  if (!fs.existsSync(sourceToolsDir)) return;

  fs.readdirSync(sourceToolsDir).forEach(toolFolder => {
    const isEnterNode = toolFolder === 'enter_node' || toolFolder.endsWith('_enter_node');
    const isStartFlow = toolFolder.startsWith('start_');
    const isSetVars = toolFolder === 'set_variables';

    if (!isEnterNode && !isStartFlow && !isSetVars) {
      // Don't copy custom business tools
      return;
    }

    const sourceToolPath = path.join(sourceToolsDir, toolFolder);
    const targetToolName = prefix ? `${prefix}${toolFolder}` : toolFolder;
    const targetToolPath = path.join(targetDir, 'tools', targetToolName);

    if (isSetVars) {
      // set_variables requires merging parameter arguments
      mergeSetVariablesTool(sourceToolPath, targetToolPath, targetToolName);
      return;
    }

    if (fs.existsSync(targetToolPath)) {
      fs.rmSync(targetToolPath, { recursive: true, force: true });
    }
    fs.mkdirSync(targetToolPath, { recursive: true });

    // Copy and update start tool / enter node tool files
    fs.readdirSync(sourceToolPath).forEach(item => {
      const srcItem = path.join(sourceToolPath, item);
      const destItem = path.join(targetToolPath, item.replace(toolFolder, targetToolName));

      if (fs.statSync(srcItem).isDirectory()) {
        fs.cpSync(srcItem, destItem, { recursive: true });
        
        // Update python function name inside the code
        if (item === 'python_function') {
          const pyFile = path.join(destItem, 'python_code.py');
          if (fs.existsSync(pyFile)) {
            let pyCode = fs.readFileSync(pyFile, 'utf-8');
            pyCode = pyCode.replace(new RegExp(`def\\s+${toolFolder}`, 'g'), `def ${targetToolName}`);
            fs.writeFileSync(pyFile, pyCode, 'utf-8');
          }
        }
      } else if (item.endsWith('.json')) {
        const metadata = JSON.parse(fs.readFileSync(srcItem, 'utf-8'));
        metadata.name = targetToolName;
        metadata.displayName = targetToolName;
        if (metadata.pythonFunction) {
          metadata.pythonFunction.name = targetToolName;
          metadata.pythonFunction.pythonCode = `tools/${targetToolName}/python_function/python_code.py`;
        }
        fs.writeFileSync(destItem, JSON.stringify(metadata, null, 2), 'utf-8');
      }
    });
  });
}

function mergeSetVariablesTool(sourcePath: string, targetPath: string, _targetToolName: string): void {
  // If target set_variables doesn't exist, just copy it
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
    fs.cpSync(sourcePath, targetPath, { recursive: true });
    return;
  }

  // Parse parameters from both target and source to merge them
  const sourcePyFile = path.join(sourcePath, 'python_function', 'python_code.py');
  const targetPyFile = path.join(targetPath, 'python_function', 'python_code.py');

  if (!fs.existsSync(sourcePyFile) || !fs.existsSync(targetPyFile)) return;

  const getParams = (filePath: string): string[] => {
    const code = fs.readFileSync(filePath, 'utf-8');
    const match = /def\s+set_variables\s*\(([\s\S]*?)\)\s*->/g.exec(code);
    if (!match) return [];
    return match[1].split(',').map(p => p.trim()).filter(Boolean);
  };

  const sourceParams = getParams(sourcePyFile);
  const targetParams = getParams(targetPyFile);

  const mergedParams = [...targetParams];
  for (const sParam of sourceParams) {
    const paramName = sParam.split(/[:=]/)[0].trim();
    const exists = mergedParams.some(p => p.split(/[:=]/)[0].trim() === paramName);
    if (!exists) {
      mergedParams.push(sParam);
    }
  }

  // Re-generate set_variables python code
  const paramsList = mergedParams.map(p => p.split(/[:=]/)[0].trim());
  const paramsSignature = paramsList.map(p => `${p}: Optional[Any] = None`).join(', ');
  const docstringArgs = paramsList.map(p => `        ${p}: Parameter for set_variables`).join('\n');
  const paramsAssign = paramsList.map(p => `    if ${p} is not None:\n        res["${p}"] = ${p}`).join('\n');

  const newPythonCode = `# Copyright 2026 Google LLC
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

from typing import Dict, Any, Optional

def set_variables(${paramsSignature}) -> Dict[str, Any]:
    """Sets session variables for tracking workflow state.

    Args:
${docstringArgs}
    """
    res = {}
${paramsAssign}
    return res
`;

  fs.writeFileSync(targetPyFile, newPythonCode, 'utf-8');
}

function copyEvaluations(
  sourceDir: string,
  targetDir: string,
  prefix: string,
  mountGoldenEvals: boolean,
  mountScenarioEvals: boolean
): void {
  const sourceEvalDir = path.join(sourceDir, 'evaluations');
  if (!fs.existsSync(sourceEvalDir)) return;

  const targetEvalDir = path.join(targetDir, 'evaluations');
  fs.mkdirSync(targetEvalDir, { recursive: true });

  fs.readdirSync(sourceEvalDir).forEach(evalFolder => {
    const srcFolderDir = path.join(sourceEvalDir, evalFolder);
    if (!fs.statSync(srcFolderDir).isDirectory()) return;

    let isGolden = false;
    let isScenario = false;

    const jsonFileInEval = path.join(srcFolderDir, `${evalFolder}.json`);
    if (fs.existsSync(jsonFileInEval)) {
      try {
        const evalJson = JSON.parse(fs.readFileSync(jsonFileInEval, 'utf-8'));
        if (evalJson.golden !== undefined) isGolden = true;
        if (evalJson.scenario !== undefined) isScenario = true;
      } catch {
        // ignore
      }
    }

    if (!isGolden && !isScenario) {
      if (evalFolder.startsWith('golden')) {
        isGolden = true;
      } else if (evalFolder.startsWith('scenario')) {
        isScenario = true;
      } else {
        isGolden = true;
        isScenario = true;
      }
    }

    if (isGolden && !mountGoldenEvals) return;
    if (isScenario && !mountScenarioEvals) return;

    const targetFolder = prefix ? `${prefix}${evalFolder}` : evalFolder;
    const destFolderDir = path.join(targetEvalDir, targetFolder);

    if (fs.existsSync(destFolderDir)) {
      fs.rmSync(destFolderDir, { recursive: true, force: true });
    }
    fs.mkdirSync(destFolderDir, { recursive: true });

    fs.readdirSync(srcFolderDir).forEach(file => {
      const srcFile = path.join(srcFolderDir, file);
      const destFile = path.join(destFolderDir, file.replace(evalFolder, targetFolder));

      if (file.endsWith('.json')) {
        const evalJson = JSON.parse(fs.readFileSync(srcFile, 'utf-8'));
        
        // Update displayName in the JSON
        if (evalJson.displayName) {
          evalJson.displayName = prefix ? `${prefix}${evalJson.displayName}` : evalJson.displayName;
        }

        // Replace any target agent references inside evaluation steps (for flow_agent or subagent transition checks)
        if (prefix && evalJson.golden && Array.isArray(evalJson.golden.turns)) {
          evalJson.golden.turns.forEach((turn: any) => {
            if (turn.steps && Array.isArray(turn.steps)) {
              turn.steps.forEach((step: any) => {
                if (step.expectation && step.expectation.agentTransfer && step.expectation.agentTransfer.targetAgent) {
                  const targetAgent = step.expectation.agentTransfer.targetAgent;
                  step.expectation.agentTransfer.targetAgent = `${prefix}${targetAgent}`;
                }
              });
            }
          });
        }

        if (prefix && evalJson.testCase && evalJson.testCase.testCaseConversationTurns) {
          evalJson.testCase.testCaseConversationTurns.forEach((turn: any) => {
            if (turn.expectedTestCaseResult && turn.expectedTestCaseResult.expectedActions) {
              turn.expectedTestCaseResult.expectedActions.forEach((action: any) => {
                if (action.agentTransfer && action.agentTransfer.targetAgent) {
                  const targetAgent = action.agentTransfer.targetAgent;
                  action.agentTransfer.targetAgent = `${prefix}${targetAgent}`;
                }
              });
            }
          });
        }

        fs.writeFileSync(destFile, JSON.stringify(evalJson, null, 2), 'utf-8');
      } else {
        fs.copyFileSync(srcFile, destFile);
      }
    });
  });
}
