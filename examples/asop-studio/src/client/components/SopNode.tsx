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

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { 
  ChevronRight,
  ArrowRight
} from 'lucide-react';

import { type SopNodeData, hasUnresolvedReviewRequest } from '../utils/review';

export type SopNodeType = 
  | 'action' 
  | 'route' 
  | 'input' 
  | 'condition' 
  | 'global_scope' 
  | 'terminal' 
  | 'missing' 
  | 'sub_flow'
  | 'default';

export function SopNode({ data, selected }: NodeProps & { data: SopNodeData }) {
  const nodeType = data.type || 'default';
  const isRoot = data.isRoot || false;
  
  // Custom styling based on node type
  let nodeClass = 'sop-node';
  if (hasUnresolvedReviewRequest(data)) {
    nodeClass += ' has-review-request';
  }
  let headerColor = 'var(--accent-purple)';
  
  if (isRoot) {
    nodeClass += ' root-node';
  }
  
  if (nodeType === 'global_scope') {
    nodeClass += ' global-scope-node';
    headerColor = '#14b8a6'; // Teal
  } else if (nodeType === 'terminal') {
    nodeClass += ' terminal-node';
    headerColor = '#f43f5e'; // Rose
  } else if (nodeType === 'missing') {
    nodeClass += ' missing-node';
    headerColor = '#f43f5e'; // Rose
  } else if (nodeType === 'sub_flow') {
    nodeClass += ' subflow-node';
    headerColor = '#6366f1'; // Indigo
  } else if (isRoot) {
    headerColor = 'var(--accent-purple)';
  } else if (data.intent_routes && data.intent_routes.length > 0) {
    nodeClass += ' intent-node';
    headerColor = '#3b82f6'; // Blue
  } else if (data.condition_routes && data.condition_routes.length > 0) {
    nodeClass += ' condition-node';
    headerColor = '#f97316'; // Orange
  }

  return (
    <div className={`${nodeClass} ${selected ? 'selected' : ''}`}>
      {/* Target handle (input) on top, skip for global scope */}
      {nodeType !== 'global_scope' && (
        <Handle
          type="target"
          position={Position.Top}
          id="input"
          style={{ borderColor: headerColor }}
        />
      )}
      
      {/* Node Header */}
      <div className="node-header">
        <div className="node-title" title={data.id}>
          {data.id}
        </div>
        {nodeType === 'sub_flow' && (
          <button
            className="subflow-open-btn"
            title={`Open ${data.id}`}
            onClick={(e) => {
              e.stopPropagation();
              const onOpenFlow = data.onOpenFlow as ((flowId: string) => void) | undefined;
              if (onOpenFlow) {
                onOpenFlow(data.id);
              }
            }}
          >
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      
      {/* Node Content / Agent Instructions */}
      {data.agent_instructions && (
        <div className="node-body">
          <p className="node-instructions-text">
            {data.agent_instructions}
          </p>
        </div>
      )}

      {/* Actions list if present */}
      {data.actions && data.actions.length > 0 && (
        <div className="node-actions-list">
          {data.actions.map((action, idx) => (
            <div key={idx} className="node-action-item">
              <ChevronRight size={12} className="text-secondary" style={{ color: '#f59e0b' }} />
              <span className="action-type-badge">tool</span>
              <span className="action-name" title={action.tool_name}>{action.tool_name}</span>
            </div>
          ))}
        </div>
      )}

      
      {/* Source handle (output) at bottom, skip for terminal (END) */}
      {nodeType !== 'terminal' && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          style={{ borderColor: headerColor }}
        />
      )}
    </div>
  );
}
