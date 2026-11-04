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

import { type InternalNode, Position } from '@xyflow/react';

// Helper to calculate the intersection point between the center of node A and node B
// Restricts candidate points strictly to the Top or Bottom border of the node.
function getNodeIntersection(intersectionNode: InternalNode, targetNode: InternalNode) {
  const w = (intersectionNode.measured?.width ?? 0) / 2;
  const h = (intersectionNode.measured?.height ?? 0) / 2;

  const intersectionNodePosition = intersectionNode.internals.positionAbsolute;
  const targetPosition = targetNode.internals.positionAbsolute;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  
  const targetW = (targetNode.measured?.width ?? 0) / 2;
  const targetH = (targetNode.measured?.height ?? 0) / 2;
  const x1 = targetPosition.x + targetW;
  const y1 = targetPosition.y + targetH;

  // Enforce Top/Bottom candidate boundary only
  const isAbove = y1 < y2;
  const y = isAbove ? y2 - h : y2 + h;

  let x = x2;
  const dy = y1 - y2;
  if (dy !== 0) {
    x = x2 + (y - y2) * (x1 - x2) / dy;
  }

  // Clamp x to the horizontal bounds of the node
  const minX = intersectionNodePosition.x;
  const maxX = intersectionNodePosition.x + (intersectionNode.measured?.width ?? 0);
  const clampedX = Math.max(minX, Math.min(maxX, x));

  return { x: clampedX, y };
}

// Helper to determine edge position based on node geometry and the intersection point.
// Since we only intersect with Top/Bottom edges, we always return Position.Top or Position.Bottom.
function getEdgePosition(node: InternalNode, intersectionPoint: { x: number; y: number }) {
  const nodeY = node.internals.positionAbsolute.y;
  const height = node.measured?.height ?? 0;
  const centerY = nodeY + height / 2;

  if (intersectionPoint.y < centerY) {
    return Position.Top;
  } else {
    return Position.Bottom;
  }
}

// Returns the source and target coordinate parameters plus connection handle positions
export function getEdgeParams(source: InternalNode, target: InternalNode) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}
