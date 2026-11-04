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

import { BaseEdge, EdgeLabelRenderer, getBezierPath, useInternalNode, useEdges, type EdgeProps, Position } from '@xyflow/react';
import { getEdgeParams } from '../utils/floatingEdge';

function getCustomBezierPath({
  sx,
  sy,
  tx,
  ty,
  sourcePos,
  targetPos,
  offset,
}: {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePos: Position;
  targetPos: Position;
  offset: number;
}) {
  const dy = Math.max(Math.abs(ty - sy) * 0.5, 50);

  const cp1x = sx + offset;
  const cp1y = sourcePos === Position.Bottom ? sy + dy : sy - dy;

  const cp2x = tx + offset;
  const cp2y = targetPos === Position.Top ? ty - dy : ty + dy;

  const path = `M ${sx},${sy} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${tx},${ty}`;

  const labelX = 0.125 * sx + 0.375 * cp1x + 0.375 * cp2x + 0.125 * tx;
  const labelY = 0.125 * sy + 0.375 * cp1y + 0.375 * cp2y + 0.125 * ty;

  return [path, labelX, labelY] as const;
}

export default function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  className,
  label,
}: EdgeProps & { className?: string }) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const edges = useEdges();

  if (!sourceNode || !targetNode) {
    return null;
  }

  const isSelfLoop = source === target;

  // Find all mutual edges (both directions) between the source and target
  const mutualEdges = edges.filter(
    (e) =>
      (e.source === source && e.target === target) ||
      (e.source === target && e.target === source)
  );

  // In these cases we'll need to compute the curves manually so that edges don't overlap
  const hasMultipleEdges = mutualEdges.length > 1;
  const isCustomEdge = isSelfLoop || hasMultipleEdges;

  if (!isCustomEdge) {
    // Default case: use standard getBezierPath from @xyflow/react
    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
      sourceNode,
      targetNode
    );

    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      targetX: tx,
      targetY: ty,
    });

    const transform = `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`;

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={style}
          className={className}
        />
        {label && typeof label === 'string' && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform,
                pointerEvents: 'none',
              }}
              className={`react-flow__edge-label-container ${className || ''}`}
            >
              <div className="react-flow__edge-label-content">
                {label}
              </div>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }

  // Custom logic for self-loops or multiple/bidirectional edges
  let edgePath = '';
  let labelX = 0;
  let labelY = 0;
  let transform = '';

  if (isSelfLoop) {
    const x = sourceNode.internals.positionAbsolute.x;
    const y = sourceNode.internals.positionAbsolute.y;
    const w = sourceNode.measured?.width ?? 0;
    const h = sourceNode.measured?.height ?? 0;

    // For self-loops, we filter only edges with the same source and target
    const selfLoopEdges = edges.filter(
      (e) => e.source === source && e.target === target
    );
    const selfIndex = selfLoopEdges.findIndex((e) => e.id === id);
    const index = selfIndex === -1 ? 0 : selfIndex;

    const isLeft = index % 2 === 1;
    const sideIndex = Math.floor(index / 2);

    const baseOffset = 60 + sideIndex * 50;
    const staggerY = (sideIndex % 2 === 0 ? 1 : -1) * Math.floor((sideIndex + 1) / 2) * 25;

    const startX = isLeft ? x : x + w;
    const endX = isLeft ? x : x + w;

    const startY = Math.max(y + 10, Math.min(y + h - 10, y + h * 0.3 + staggerY));
    const endY = Math.max(y + 10, Math.min(y + h - 10, y + h * 0.7 + staggerY));

    const cp1x = isLeft ? x - baseOffset : x + w + baseOffset;
    const cp1y = startY;
    const cp2x = isLeft ? x - baseOffset : x + w + baseOffset;
    const cp2y = endY;

    edgePath = `M ${startX},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`;

    const apexX = isLeft ? x - 0.75 * baseOffset : x + w + 0.75 * baseOffset;
    labelX = isLeft ? apexX - 10 : apexX + 10;
    labelY = (startY + endY) / 2;
    transform = `translate(${isLeft ? '-100%' : '0%'}, -50%) translate(${labelX}px,${labelY}px)`;
  } else {
    // Parallel or bidirectional edges
    const { sx: baseSx, sy, tx: baseTx, ty, sourcePos, targetPos } = getEdgeParams(
      sourceNode,
      targetNode
    );

    // Sort mutual edges by ID to ensure stable index assignment across both edge directions
    const sortedMutualEdges = [...mutualEdges].sort((a, b) => a.id.localeCompare(b.id));
    const edgeIndex = sortedMutualEdges.findIndex((e) => e.id === id);
    const index = edgeIndex === -1 ? 0 : edgeIndex;

    const totalEdges = sortedMutualEdges.length;
    const step = 60;
    const offset = (index - (totalEdges - 1) / 2) * step;

    // Slightly shift the connection points on the node boundary to separate the arrowheads
    const sx = baseSx + offset * 0.15;
    const tx = baseTx + offset * 0.15;

    const [path, lx, ly] = getCustomBezierPath({
      sx,
      sy,
      tx,
      ty,
      sourcePos,
      targetPos,
      offset,
    });

    edgePath = path;
    labelX = lx;
    labelY = ly;
    transform = `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`;
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
        className={className}
      />
      {label && typeof label === 'string' && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform,
              pointerEvents: 'none',
            }}
            className={`react-flow__edge-label-container ${className || ''}`}
          >
            <div className="react-flow__edge-label-content">
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
