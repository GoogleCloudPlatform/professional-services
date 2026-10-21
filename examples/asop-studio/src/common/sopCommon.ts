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

import YAML from 'yaml';

export interface SopProject {
  mainFile: string;
  files: Record<string, string>;
}

export interface UnifiedSop {
  sop: {
    id: string;
    name: string;
    version: number;
    flows: Record<string, any>;
    example_journeys?: any[];
  };
}

export function formatProjectName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function rewriteRoutesToFiles(routes: any[], flowKeysOrMap: string[] | Record<string, string>): void {
  if (!Array.isArray(routes)) return;
  routes.forEach(route => {
    if (route && route.target_flow) {
      if (Array.isArray(flowKeysOrMap)) {
        if (flowKeysOrMap.includes(route.target_flow)) {
          route.target_flow = `${route.target_flow}.yml`;
        }
      } else {
        const mapped = flowKeysOrMap[route.target_flow];
        if (mapped) {
          route.target_flow = mapped;
        }
      }
    }
  });
}

export function rewriteRoutesToFlowIds(routes: any[], fileToFlowId: Record<string, string>): void {
  if (!Array.isArray(routes)) return;
  routes.forEach(route => {
    if (route && route.target_flow) {
      const flowId = fileToFlowId[route.target_flow];
      if (flowId) {
        route.target_flow = flowId;
      } else {
        route.target_flow = route.target_flow.replace(/\.[^/.]+$/, "");
      }
    }
  });
}

export function validateSopProject(project: SopProject): void {
  let commonVersion: any = null;
  for (const [filename, fileContent] of Object.entries(project.files)) {
    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
      try {
        const parsed = YAML.parse(fileContent);
        if (parsed && parsed.flow) {
          const version = parsed.flow.version;
          if (version === undefined || version === null) {
            throw new Error(`Flow file "${filename}" is missing the "version" field.`);
          }
          if (commonVersion === null) {
            commonVersion = version;
          } else if (commonVersion !== version) {
            throw new Error(
              `Consistent spec version mismatch: Flow file "${filename}" has version "${version}", but other flows have version "${commonVersion}". All flows in the SOP must specify the same version of the spec.`
            );
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('version')) {
          throw err;
        }
      }
    }
  }
}

export function parseYamlToSopProject(content: string, _sanitizedName?: string): SopProject {
  const parsed = YAML.parse(content);
  const files: Record<string, string> = {};
  let mainFile = 'main.yml';

  if (parsed && typeof parsed === 'object' && parsed.sop && typeof parsed.sop === 'object') {
    const sop = parsed.sop;
    if (!sop.id) {
      throw new Error('Invalid SOP format: missing "sop.id"');
    }
    if (sop.version === undefined || sop.version === null) {
      throw new Error('Invalid SOP format: missing "sop.version"');
    }
    if (!sop.flows || typeof sop.flows !== 'object') {
      throw new Error('Invalid SOP format: missing "sop.flows" dictionary');
    }

    const flowKeys = Object.keys(sop.flows);
    const mainFileKey = flowKeys.find(k => k === 'main' || k.endsWith('-main-flow') || k.endsWith('-main')) || flowKeys[0];

    const flowIdToFilename: Record<string, string> = {};
    flowKeys.forEach(k => {
      flowIdToFilename[k] = k === mainFileKey ? 'main.yml' : `${k}.yml`;
    });

    let exampleJourneys = sop.example_journeys;
    if (Array.isArray(exampleJourneys)) {
      exampleJourneys = JSON.parse(JSON.stringify(exampleJourneys));
      exampleJourneys.forEach((journey: any) => {
        if (Array.isArray(journey.steps)) {
          journey.steps.forEach((step: any) => {
            if (step && step.current_flow) {
              const filename = flowIdToFilename[step.current_flow];
              if (filename) {
                step.current_flow = filename;
              }
            }
          });
        }
      });
    }

    for (const [flowId, flowSpecRaw] of Object.entries(sop.flows)) {
      if (!flowSpecRaw || typeof flowSpecRaw !== 'object') {
        throw new Error(`Invalid flow specification for flow: ${flowId}`);
      }

      const flowSpec = JSON.parse(JSON.stringify(flowSpecRaw));

      if (flowSpec.global_intent_routes) {
        rewriteRoutesToFiles(flowSpec.global_intent_routes, flowIdToFilename);
      }
      if (flowSpec.nodes && Array.isArray(flowSpec.nodes)) {
        flowSpec.nodes.forEach((node: any) => {
          if (node.condition_routes) {
            rewriteRoutesToFiles(node.condition_routes, flowIdToFilename);
          }
          if (node.intent_routes) {
            rewriteRoutesToFiles(node.intent_routes, flowIdToFilename);
          }
        });
      }

      const fileContent: any = {
        flow: {
          id: flowId,
          version: sop.version,
          ...flowSpec
        }
      };

      if (flowId === mainFileKey && exampleJourneys) {
        fileContent.example_journeys = exampleJourneys;
      }

      const filename = flowIdToFilename[flowId];
      files[filename] = YAML.stringify(fileContent);
    }
  } else if (parsed && typeof parsed === 'object' && parsed.flow) {
    files['main.yml'] = content;
  } else if (parsed && typeof parsed === 'object' && parsed.flows && typeof parsed.flows === 'object') {
    for (const [filename, flowContent] of Object.entries(parsed.flows)) {
      files[filename] = typeof flowContent === 'string' ? flowContent : YAML.stringify(flowContent);
    }
  } else {
    throw new Error('Invalid YAML format: must contain a top-level "sop", "flow" or "flows" key.');
  }

  const project = { mainFile, files };
  validateSopProject(project);
  return project;
}

export function buildUnifiedSop(projectName: string, files: Record<string, string>): UnifiedSop {
  const fileToFlowId: Record<string, string> = {};
  const parsedFlows: Record<string, any> = {};
  let sopVersion: number | undefined = undefined;
  let aggregatedJourneys: any[] = [];

  Object.entries(files).forEach(([file, fileContent]) => {
    if (file.startsWith('_snapshots/')) return;
    if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      try {
        const parsed = YAML.parse(fileContent);
        if (parsed) {
          if (parsed.flow) {
            const flowId = parsed.flow.id || file.replace(/\.[^/.]+$/, "");
            fileToFlowId[file] = flowId;
            
            const fileBase = file.replace(/\.[^/.]+$/, "");
            fileToFlowId[fileBase] = flowId;

            parsedFlows[flowId] = JSON.parse(JSON.stringify(parsed.flow));

            const version = parsed.flow.version;
            if (version !== undefined && version !== null) {
              if (sopVersion === undefined) {
                sopVersion = version;
              }
            }
          }

          const journeys = parsed.example_journeys || parsed.flow?.example_journeys;
          if (Array.isArray(journeys)) {
            aggregatedJourneys = aggregatedJourneys.concat(JSON.parse(JSON.stringify(journeys)));
          }
        }
      } catch (err) {}
    }
  });

  const exportedFlows: Record<string, any> = {};

  for (const [flowId, flowObj] of Object.entries(parsedFlows)) {
    const { id, version, ...flowSpec } = flowObj;
    delete flowSpec.example_journeys;

    if (flowSpec.global_intent_routes) {
      rewriteRoutesToFlowIds(flowSpec.global_intent_routes, fileToFlowId);
    }
    if (flowSpec.nodes && Array.isArray(flowSpec.nodes)) {
      flowSpec.nodes.forEach((node: any) => {
        if (node.condition_routes) {
          rewriteRoutesToFlowIds(node.condition_routes, fileToFlowId);
        }
        if (node.intent_routes) {
          rewriteRoutesToFlowIds(node.intent_routes, fileToFlowId);
        }
      });
    }

    exportedFlows[flowId] = flowSpec;
  }

  if (aggregatedJourneys.length > 0) {
    aggregatedJourneys.forEach((journey: any) => {
      if (Array.isArray(journey.steps)) {
        journey.steps.forEach((step: any) => {
          if (step && step.current_flow) {
            const flowId = fileToFlowId[step.current_flow];
            if (flowId) {
              step.current_flow = flowId;
            } else {
              step.current_flow = step.current_flow.replace(/\.[^/.]+$/, "");
            }
          }
        });
      }
    });
  }

  return {
    sop: {
      id: projectName.toLowerCase(),
      name: formatProjectName(projectName),
      version: sopVersion ?? 2,
      flows: exportedFlows,
      ...(aggregatedJourneys.length > 0 ? { example_journeys: aggregatedJourneys } : {})
    }
  };
}
