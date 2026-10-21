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

export const GUARDRAIL_ID = 'asop-prompt-guardrail';
export const GUARDRAIL_DISPLAY_NAME = 'ASOP Prompt Guardrail';
export const GUARDRAIL_DIR_NAME = 'asop_prompt_guardrail';

export type CxasGraphGuidedVariant = 'multi-agent-subflows' | 'single-agent-flow-loader';

/**
 * Constant determining the active Graph Guided export implementation variant for CXAS agents.
 * - 'multi-agent-subflows' (Default): Modular sub-agent per subflow with embedded flow JSON in flow-prefixed enter_node tools and before_model callback handoffs.
 * - 'single-agent-flow-loader': Monolithic flow_agent loaded via start_flow tool in session state.
 */
export const DEFAULT_CXAS_GRAPH_GUIDED_VARIANT: CxasGraphGuidedVariant = 'multi-agent-subflows';

