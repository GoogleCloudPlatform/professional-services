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

export interface ReviewRequest {
  id: string;
  date: string;
  topic: 'TECHNICAL' | 'DESIGN';
  from?: string;
  reason: string;
  resolved: boolean;
}

export interface SopNodeData {
  id: string;
  label: string;
  agent_instructions?: string;
  actions?: Array<{
    type: string;
    tool_name?: string;
    tool_params?: Record<string, unknown>;
    mock_responses?: Record<string, unknown>;
    store_result_variable?: string;
    review_requests?: ReviewRequest[];
  }>;
  condition_routes?: Array<{
    condition: string;
    target_node: string;
    review_requests?: ReviewRequest[];
  }>;
  intent_routes?: Array<{
    intent: string;
    target_node: string;
    set_parameters?: string[];
    review_requests?: ReviewRequest[];
  }>;
  isRoot?: boolean;
  type?: string;
  review_requests?: ReviewRequest[];
  [key: string]: unknown;
}

export interface SopEdgeData {
  type: string;
  fullLabel?: string;
  set_variables?: unknown[];
  review_requests?: ReviewRequest[];
}

export function hasUnresolvedReviewRequest(data: SopNodeData): boolean {
  if (data.review_requests?.some(r => !r.resolved)) {
    return true;
  }
  if (data.actions?.some(action => action.review_requests?.some(r => !r.resolved))) {
    return true;
  }
  if (data.condition_routes?.some(route => route.review_requests?.some(r => !r.resolved))) {
    return true;
  }
  if (data.intent_routes?.some(route => route.review_requests?.some(r => !r.resolved))) {
    return true;
  }
  return false;
}
