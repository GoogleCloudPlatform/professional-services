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

import type AdmZip from 'adm-zip';

export interface CxasExportContext {
  projectName: string;
  folderPath: string;
  zip: AdmZip;
  blueprintDir: string;
  variablesMap: Map<string, string>; // name -> CXAS type
  toolsMap: Map<string, { params: Set<string>; mockResponses: Record<string, unknown>; storeResultVariables: Set<string> }>;
  childAgents: string[];
  routingInstructions: string[];
  warnings?: string[];
}

export interface SopReviewRequest {
  id: string;
  date: string;
  topic: 'TECHNICAL' | 'DESIGN';
  from?: string;
  reason: string;
  resolved: boolean;
}

export interface SopVariable {
  name: string;
  type?: string;
}

export interface SopAction {
  type: string;
  tool_name?: string;
  tool_params?: Record<string, unknown>;
  mock_responses?: Record<string, unknown>;
  store_result_variable?: string;
  review_requests?: SopReviewRequest[];
}

export interface SopIntentRoute {
  intent: string;
  target_node?: string;
  target_flow?: string;
  set_variables?: Array<string | SopVariable>;
  review_requests?: SopReviewRequest[];
}

export interface SopConditionRoute {
  condition: string;
  target_node?: string;
  target_flow?: string;
  review_requests?: SopReviewRequest[];
}

export interface SopNode {
  id: string;
  agent_instructions?: string;
  actions?: SopAction[];
  intent_routes?: SopIntentRoute[];
  condition_routes?: SopConditionRoute[];
  review_requests?: SopReviewRequest[];
}

export interface SopFlow {
  id?: string;
  root_node_id: string;
  global_intent_routes?: SopIntentRoute[];
  input_variables?: any[];
  nodes?: SopNode[];
}

export interface ParsedSopFlow {
  flow: SopFlow;
}
