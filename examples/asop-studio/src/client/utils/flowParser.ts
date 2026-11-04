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
import dagre from '@dagrejs/dagre';
import { type Node, type Edge, MarkerType } from '@xyflow/react';
import { type SopNodeData, type ReviewRequest } from './review';

interface FlowRoute {
  condition?: string;
  intent?: string;
  target_node?: string;
  target_flow?: string;
  set_variables?: any[];
  review_requests?: ReviewRequest[];
}

interface FlowNode {
  id: string;
  agent_instructions?: string;
  actions?: Array<{
    type: string;
    tool_name?: string;
    tool_params?: Record<string, unknown>;
    mock_responses?: Record<string, unknown>;
    store_result_variable?: string;
    review_requests?: ReviewRequest[];
  }>;
  condition_routes?: FlowRoute[];
  intent_routes?: FlowRoute[];
  review_requests?: ReviewRequest[];
}

// Estimate node height for dagre layout to prevent overlapping
const estimateNodeHeight = (nodeData: SopNodeData) => {
  let height = 80; // Base padding/header/footer height
  if (nodeData.agent_instructions) {
    const lines = Math.ceil(nodeData.agent_instructions.length / 35);
    height += lines * 15;
  }
  if (nodeData.actions && nodeData.actions.length > 0) {
    height += nodeData.actions.length * 45;
  }
  return Math.max(height, 130); // minimum height
};

export function parseAndLayoutFlow(yamlContent: string): {
  nodes: Node<SopNodeData>[];
  edges: Edge[];
  flowId: string;
} {
  const parsed = YAML.parse(yamlContent);
  if (!parsed || !parsed.flow) {
    throw new Error('Invalid YAML format: missing root "flow" element.');
  }

  const flow = parsed.flow;
  const flowId = flow.id || 'unnamed-flow';
  const rootNodeId = flow.root_node_id;

  const rawNodes: (Omit<Node<SopNodeData>, 'position'> & { position?: { x: number; y: number } })[] = [];
  const rawEdges: { source: string; target: string; label?: string; type: string; routeIndex: number; set_variables?: any[]; review_requests?: ReviewRequest[] }[] = [];

  const targetSet = new Set<string>();
  const definedNodeIds = new Set<string>();

  // 1. Process defined nodes
  if (flow.nodes && Array.isArray(flow.nodes)) {
    flow.nodes.forEach((node: FlowNode) => {
      definedNodeIds.add(node.id);
      const isRoot = node.id === rootNodeId;
      const hasActions = node.actions && node.actions.length > 0;

      rawNodes.push({
        id: node.id,
        type: 'sopNode',
        data: {
          id: node.id,
          label: node.id,
          isRoot,
          agent_instructions: node.agent_instructions,
          actions: node.actions,
          condition_routes: node.condition_routes as unknown as SopNodeData['condition_routes'],
          intent_routes: node.intent_routes as unknown as SopNodeData['intent_routes'],
          type: hasActions ? 'action' : 'default',
          review_requests: node.review_requests,
        },
      });

      // Process condition routes
      if (node.condition_routes && Array.isArray(node.condition_routes)) {
        node.condition_routes.forEach((route: FlowRoute, routeIdx: number) => {
          const targetId = route.target_flow || route.target_node;
          if (targetId) {
            targetSet.add(targetId);
            let label = route.condition || 'true';
            if (route.target_flow && route.target_node) {
              label += ` (to ${route.target_node})`;
            }
            rawEdges.push({
              source: node.id,
              target: targetId,
              label: label,
              type: 'condition',
              routeIndex: routeIdx,
              review_requests: route.review_requests,
            });
          }
        });
      }

      // Process intent routes
      if (node.intent_routes && Array.isArray(node.intent_routes)) {
        node.intent_routes.forEach((route: FlowRoute, routeIdx: number) => {
          const targetId = route.target_flow || route.target_node;
          if (targetId) {
            targetSet.add(targetId);
            let label = route.intent;
            if (route.target_flow && route.target_node) {
              label += ` (to ${route.target_node})`;
            }
            rawEdges.push({
              source: node.id,
              target: targetId,
              label: label,
              type: 'intent',
              routeIndex: routeIdx,
              set_variables: route.set_variables,
              review_requests: route.review_requests,
            });
          }
        });
      }
    });
  }

  // 2. Process Global intent routes
  if (flow.global_intent_routes && Array.isArray(flow.global_intent_routes) && flow.global_intent_routes.length > 0) {
    definedNodeIds.add('GLOBAL_SCOPE');
    rawNodes.push({
      id: 'GLOBAL_SCOPE',
      type: 'sopNode',
      data: {
        id: 'GLOBAL_SCOPE',
        label: '* Any State *',
        agent_instructions: 'Represents global routes available from any node waiting for an intent.',
        type: 'global_scope',
      },
    });

    flow.global_intent_routes.forEach((route: FlowRoute, routeIdx: number) => {
      const targetId = route.target_flow || route.target_node;
      if (targetId) {
        targetSet.add(targetId);
        let label = route.intent;
        if (route.target_flow && route.target_node) {
          label += ` (to ${route.target_node})`;
        }
        rawEdges.push({
          source: 'GLOBAL_SCOPE',
          target: targetId,
          label: label,
          type: 'global_intent',
          routeIndex: routeIdx,
          set_variables: route.set_variables,
          review_requests: route.review_requests,
        });
      }
    });
  }

  // 3. Handle END node
  if (targetSet.has('END') && !definedNodeIds.has('END')) {
    definedNodeIds.add('END');
    rawNodes.push({
      id: 'END',
      type: 'sopNode',
      data: {
        id: 'END',
        label: 'END',
        agent_instructions: 'System termination state.',
        type: 'terminal',
      },
    });
  }

  // 4. Handle dangling/missing references and subflows
  targetSet.forEach((targetId) => {
    if (!definedNodeIds.has(targetId)) {
      definedNodeIds.add(targetId);
      const isSubFlow = targetId.endsWith('.yml') || targetId.endsWith('.yaml');
      rawNodes.push({
        id: targetId,
        type: 'sopNode',
        data: {
          id: targetId,
          label: targetId,
          agent_instructions: isSubFlow
            ? undefined
            : `Warning: This node ID "${targetId}" was referenced but is not defined in the nodes list.`,
          type: isSubFlow ? 'sub_flow' : 'missing',
        },
      });
    }
  });

  // 5. Apply Dagre Layout
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    nodesep: 80,
    ranksep: 120,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 280;

  rawNodes.forEach((node) => {
    const height = estimateNodeHeight(node.data);
    g.setNode(node.id, { width: nodeWidth, height });
  });

  rawEdges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  // Map positioned nodes back to React Flow format
  const positionedNodes = rawNodes.map((node) => {
    const nodeInfo = g.node(node.id);
    const height = estimateNodeHeight(node.data);
    return {
      ...node,
      position: {
        x: nodeInfo.x - nodeWidth / 2,
        y: nodeInfo.y - height / 2,
      },
    };
  }) as Node<SopNodeData>[];

  // Map edges to React Flow format with proper styles
  const mappedEdges = rawEdges.map((edge, idx) => {
    let strokeColor = 'var(--border-medium)';
    let strokeDasharray: string | undefined = undefined;

    if (edge.type === 'condition') {
      strokeColor = '#f97316'; // orange solid
    } else if (edge.type === 'intent') {
      strokeColor = '#3b82f6'; // blue solid
    } else if (edge.type === 'global_intent') {
      strokeColor = '#14b8a6'; // aqua/teal color
      strokeDasharray = '5,5'; // dashed line
    }

    let shortLabel = edge.label;
    if (shortLabel && shortLabel.length > 30) {
      shortLabel = shortLabel.substring(0, 30) + '...';
    }

    return {
      id: `${edge.source}-${edge.target}-${idx}`,
      source: edge.source,
      target: edge.target,
      type: 'floating',
      label: shortLabel,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: strokeColor,
      },
      style: {
        stroke: strokeColor,
        strokeWidth: 2,
        strokeDasharray,
      },
      labelStyle: {
        fill: '#cbd5e1',
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: '#141724',
        fillOpacity: 0.95,
      },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
      // Pass the route type for selection filtering if needed
      data: {
        type: edge.type,
        fullLabel: edge.label,
        routeIndex: edge.routeIndex,
        set_variables: edge.set_variables,
        review_requests: edge.review_requests,
      },
    };
  });

  return {
    nodes: positionedNodes,
    edges: mappedEdges,
    flowId,
  };
}
