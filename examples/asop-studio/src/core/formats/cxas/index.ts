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
import YAML from 'yaml';
import type { FormatModule, ExportOptions, ExportResult } from '../types';
import type { CxasExportContext } from './types';
import { extractVariables } from './variables';
import { formatProjectName, buildUnifiedSop, getAssetsPath } from '../utils';
import { processSubflows } from './agents';
import { generateTools } from './tools';
import { writeCoordinatorAndConfigs } from './coordinator';
import { exportGraphGuided } from './graphGuided';
import { sanitizeResourceId } from './utils';
import { GUARDRAIL_ID, GUARDRAIL_DISPLAY_NAME, GUARDRAIL_DIR_NAME } from './constants';
import {
  findMainFlowDetails,
  buildFullyAgenticEvaluationJson,
  buildScenarioEvaluationJson
} from './evaluations';


export const cxasFormat: FormatModule = {
  id: 'cxas',

  async export({ projectName, folderPath, mode }: ExportOptions): Promise<ExportResult> {
    const zip = new AdmZip();
    const files = fs.readdirSync(folderPath);

    // Extract variables
    const variablesMap = extractVariables(folderPath, files);

    if (mode === 'graph-guided') {
      const agentDirName = sanitizeResourceId(projectName.toLowerCase());
      const context: CxasExportContext = {
        projectName,
        folderPath,
        zip,
        blueprintDir: getAssetsPath('src/core/assets/cxas_graph_guided_blueprint'),
        variablesMap,
        toolsMap: new Map(),
        childAgents: [],
        routingInstructions: []
      };

      await exportGraphGuided(context, agentDirName, files);

      const cxasBuffer = zip.toBuffer();

      return {
        data: cxasBuffer,
        contentType: 'application/zip',
        filename: `${projectName}_cxas_graph_guided.zip`,
        warnings: context.warnings
      };
    }

    // Resolve blueprint paths
    const blueprintDir = getAssetsPath('src/core/assets/cxas_blueprint');
    if (!fs.existsSync(blueprintDir)) {
      throw new Error(`Blueprint directory not found at ${blueprintDir}`);
    }

    // Load templates
    const appJsonTemplate = JSON.parse(fs.readFileSync(path.join(blueprintDir, 'app.json'), 'utf-8'));
    const environmentJsonTemplate = JSON.parse(fs.readFileSync(path.join(blueprintDir, 'environment.json'), 'utf-8'));

    // Find main flow input_variables, global instructions, and prompt guard for defaults
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

    const agentDirName = sanitizeResourceId(projectName.toLowerCase());
    const appJson: any = {
      ...appJsonTemplate,
      name: agentDirName,
      displayName: formatProjectName(projectName),
      description: `CX Agent Studio export for ${projectName}`,
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

    // Create execution context
    const context: CxasExportContext = {
      projectName,
      folderPath,
      zip,
      blueprintDir,
      variablesMap,
      toolsMap: new Map(),
      childAgents: [],
      routingInstructions: []
    };

    // Find main flow details
    const { mainFlowId } = findMainFlowDetails(folderPath, files);

    // Process all subflows
    processSubflows(context, files, agentDirName, mainFlowId);

    // Generate collected tools
    await generateTools(context, agentDirName);

    // Write Coordinator Root Agent files
    writeCoordinatorAndConfigs(context, agentDirName, {
      appJson,
      environmentJsonTemplate,
      globalInstructions
    });

    // Write Evaluations (Golden & Scenario Cases) for Fully Agentic
    const sopSpec = buildUnifiedSop(projectName, folderPath);

    if (mainFlowId && sopSpec.sop?.example_journeys && Array.isArray(sopSpec.sop.example_journeys)) {
      sopSpec.sop.example_journeys.forEach((journey: any) => {
        if (!journey.name || !journey.steps || !Array.isArray(journey.steps)) return;

        // Write Golden Case
        const goldenDisplayName = `Golden - ${journey.name}`;
        const sanitizedGoldenName = sanitizeResourceId(goldenDisplayName);
        const goldenEvalJson = buildFullyAgenticEvaluationJson(journey, sopSpec, mainFlowId, goldenDisplayName);

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

    const cxasBuffer = zip.toBuffer();

    return {
      data: cxasBuffer,
      contentType: 'application/zip',
      filename: `${projectName}_cxas.zip`
    };
  }
};
