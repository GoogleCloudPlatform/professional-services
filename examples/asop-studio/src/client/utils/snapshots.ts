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

import YAML, { visit, isMap } from 'yaml';
import { type ReviewRequest } from './review';


export interface SnapshotMetadata {
  id: string;
  name: string;
  timestamp: number;
  description?: string;
}

export interface SnapshotsFileContent {
  snapshots: SnapshotMetadata[];
}

/**
 * Scans the files map for snapshots, ensures the original snapshot is initialized,
 * and builds/heals the _snapshots/metadata.yml file if needed.
 */
export function initializeSnapshots(files: Record<string, string>): Record<string, string> {
  const newFiles = { ...files };
  const metadataKey = '_snapshots/metadata.yml';
  
  let metadata: SnapshotsFileContent = { snapshots: [] };
  if (files[metadataKey]) {
    try {
      metadata = YAML.parse(files[metadataKey]) || { snapshots: [] };
    } catch (e) {
      console.error('Failed to parse snapshots metadata', e);
    }
  }

  // Scan existing files starting with _snapshots/ to find any snapshot directories
  const existingSnapshotIds = new Set<string>();
  Object.keys(files).forEach(filename => {
    if (filename.startsWith('_snapshots/') && filename !== metadataKey) {
      const parts = filename.split('/');
      if (parts.length > 2) {
        existingSnapshotIds.add(parts[1]);
      }
    }
  });

  // If there are no snapshot folders at all, we create the original snapshot from the current root files
  if (existingSnapshotIds.size === 0) {
    const timestamp = Date.now();
    const originalId = 'snapshot_original';
    
    // Copy all root files into the original snapshot folder
    Object.entries(files).forEach(([filename, content]) => {
      if (!filename.startsWith('_snapshots/')) {
        newFiles[`_snapshots/${originalId}/${filename}`] = content;
      }
    });

    metadata.snapshots = [{
      id: originalId,
      name: 'Original Upload',
      timestamp,
      description: 'Baseline snapshot created automatically on load.'
    }];

    newFiles[metadataKey] = YAML.stringify(metadata);
  } else {
    // If there are snapshot folders but no metadata file, reconstruct it
    if (!metadata.snapshots || metadata.snapshots.length === 0) {
      metadata.snapshots = [];
      existingSnapshotIds.forEach(id => {
        metadata.snapshots.push({
          id,
          name: id === 'snapshot_original' ? 'Original Upload' : id.replace('snapshot_', 'Snapshot '),
          timestamp: id === 'snapshot_original' ? Date.now() - 10000 : parseInt(id.replace('snapshot_', ''), 10) || Date.now()
        });
      });
      // Sort oldest first for metadata list
      metadata.snapshots.sort((a, b) => a.timestamp - b.timestamp);
      newFiles[metadataKey] = YAML.stringify(metadata);
    }
  }

  return newFiles;
}

/**
 * Checks if the current root files (working copy) have any changes compared to the latest snapshot.
 */
export function hasChangesSinceLatestSnapshot(files: Record<string, string>): boolean {
  const metadataKey = '_snapshots/metadata.yml';
  if (!files[metadataKey]) return false;

  let metadata: SnapshotsFileContent = { snapshots: [] };
  try {
    metadata = YAML.parse(files[metadataKey]) || { snapshots: [] };
  } catch (e) {
    return false;
  }

  if (!metadata.snapshots || metadata.snapshots.length === 0) return false;
  
  // Latest snapshot is the last one in the metadata list
  const latestSnapshot = metadata.snapshots[metadata.snapshots.length - 1];
  const latestSnapshotId = latestSnapshot.id;

  const rootFiles = Object.keys(files).filter(k => !k.startsWith('_snapshots/'));
  
  // Find all file keys in the latest snapshot
  const latestSnapshotPrefix = `_snapshots/${latestSnapshotId}/`;
  const snapshotFiles = Object.keys(files)
    .filter(k => k.startsWith(latestSnapshotPrefix))
    .map(k => k.substring(latestSnapshotPrefix.length));

  // If the number of files differs, there are changes
  if (rootFiles.length !== snapshotFiles.length) return true;

  // Compare file contents
  for (const rootFile of rootFiles) {
    const snapshotFileKey = `${latestSnapshotPrefix}${rootFile}`;
    if (files[rootFile] !== files[snapshotFileKey]) {
      return true;
    }
  }

  return false;
}

/**
 * Creates a new snapshot by copying current working copy files to a new snapshot folder
 * and updating the metadata file.
 */
export function createSnapshot(
  files: Record<string, string>,
  name: string,
  description?: string
): { updatedFiles: Record<string, string>; newSnapshotId: string } {
  const timestamp = Date.now();
  const newSnapshotId = `snapshot_${timestamp}`;
  const newFiles = { ...files };
  const metadataKey = '_snapshots/metadata.yml';

  // Copy all current root files (working copy) into the new snapshot folder
  Object.entries(files).forEach(([filename, content]) => {
    if (!filename.startsWith('_snapshots/')) {
      newFiles[`_snapshots/${newSnapshotId}/${filename}`] = content;
    }
  });

  // Load and update metadata
  let metadata: SnapshotsFileContent = { snapshots: [] };
  if (files[metadataKey]) {
    try {
      metadata = YAML.parse(files[metadataKey]) || { snapshots: [] };
    } catch (e) {}
  }

  if (!metadata.snapshots) {
    metadata.snapshots = [];
  }

  metadata.snapshots.push({
    id: newSnapshotId,
    name: name.trim() || `Snapshot ${new Date(timestamp).toLocaleString()}`,
    timestamp,
    description: description?.trim()
  });

  newFiles[metadataKey] = YAML.stringify(metadata);

  return { updatedFiles: newFiles, newSnapshotId };
}

/**
 * Updates a node's agent instructions within the flow YAML content, preserving comments and formatting.
 */
export function updateNodeInstructionsInYaml(yamlContent: string, nodeId: string, newInstructions: string): string {
  const doc = YAML.parseDocument(yamlContent);
  if (!doc) return yamlContent;

  const flow = doc.get('flow') as any;
  if (!flow || typeof flow.get !== 'function') return yamlContent;

  const nodes = flow.get('nodes') as any;
  if (nodes && Array.isArray(nodes.items)) {
    for (const node of nodes.items) {
      if (node && typeof node.get === 'function' && node.get('id') === nodeId) {
        if (newInstructions.trim() === '') {
          node.delete('agent_instructions');
        } else {
          node.set('agent_instructions', newInstructions);
        }
        return doc.toString();
      }
    }
  }

  return yamlContent;
}

/**
 * Updates a flow's global instructions within the flow YAML content, preserving comments and formatting.
 */
export function updateGlobalInstructionsInYaml(yamlContent: string, newInstructions: string): string {
  const doc = YAML.parseDocument(yamlContent);
  if (!doc) return yamlContent;

  const flow = doc.get('flow') as any;
  if (!flow || typeof flow.get !== 'function') return yamlContent;

  if (newInstructions.trim() === '') {
    flow.delete('global_instructions');
  } else {
    flow.set('global_instructions', newInstructions);
  }

  return doc.toString();
}

/**
 * Updates a flow's prompt guard within the flow YAML content, preserving comments and formatting.
 */
export function updatePromptGuardInYaml(yamlContent: string, newPromptGuard: string): string {
  const doc = YAML.parseDocument(yamlContent);
  if (!doc) return yamlContent;

  const flow = doc.get('flow') as any;
  if (!flow || typeof flow.get !== 'function') return yamlContent;

  if (newPromptGuard.trim() === '') {
    flow.delete('prompt_guard');
  } else {
    flow.set('prompt_guard', newPromptGuard);
  }

  return doc.toString();
}


/**
 * Updates a route's intent description or condition expression within the flow YAML content, preserving comments and formatting.
 */
export function updateRouteInYaml(
  yamlContent: string,
  sourceNodeId: string,
  routeType: 'condition' | 'intent' | 'global_intent',
  routeIndex: number,
  newValue: string
): string {
  const doc = YAML.parseDocument(yamlContent);
  if (!doc) return yamlContent;

  const flow = doc.get('flow') as any;
  if (!flow || typeof flow.get !== 'function') return yamlContent;

  if (routeType === 'global_intent' || sourceNodeId === 'GLOBAL_SCOPE') {
    const globalRoutes = flow.get('global_intent_routes') as any;
    if (globalRoutes && Array.isArray(globalRoutes.items)) {
      const route = globalRoutes.items[routeIndex];
      if (route && typeof route.set === 'function') {
        route.set('intent', newValue);
        return doc.toString();
      }
    }
  } else {
    const nodes = flow.get('nodes') as any;
    if (nodes && Array.isArray(nodes.items)) {
      for (const node of nodes.items) {
        if (node && typeof node.get === 'function' && node.get('id') === sourceNodeId) {
          const listKey = routeType === 'condition' ? 'condition_routes' : 'intent_routes';
          const routes = node.get(listKey) as any;
          if (routes && Array.isArray(routes.items)) {
            const route = routes.items[routeIndex];
            if (route && typeof route.set === 'function') {
              const key = routeType === 'condition' ? 'condition' : 'intent';
              route.set(key, newValue);
              return doc.toString();
            }
          }
        }
      }
    }
  }

  return yamlContent;
}

/**
 * Appends a new review request to a node's review_requests in the YAML content.
 */
export function addReviewRequestToNodeInYaml(
  yamlContent: string,
  nodeId: string,
  request: ReviewRequest
): string {
  const doc = YAML.parseDocument(yamlContent);
  if (!doc) return yamlContent;

  const flow = doc.get('flow') as any;
  if (!flow || typeof flow.get !== 'function') return yamlContent;

  const nodes = flow.get('nodes') as any;
  if (nodes && Array.isArray(nodes.items)) {
    for (const node of nodes.items) {
      if (node && typeof node.get === 'function' && node.get('id') === nodeId) {
        let reviews = node.get('review_requests') as any;
        if (!reviews) {
          node.set('review_requests', doc.createNode([]));
          reviews = node.get('review_requests');
        }
        reviews.add(doc.createNode(request));
        return doc.toString();
      }
    }
  }

  return yamlContent;
}

/**
 * Appends a new review request to a route's review_requests in the YAML content.
 */
export function addReviewRequestToRouteInYaml(
  yamlContent: string,
  sourceNodeId: string,
  routeType: 'condition' | 'intent' | 'global_intent',
  routeIndex: number,
  request: ReviewRequest
): string {
  const doc = YAML.parseDocument(yamlContent);
  if (!doc) return yamlContent;

  const flow = doc.get('flow') as any;
  if (!flow || typeof flow.get !== 'function') return yamlContent;

  if (routeType === 'global_intent' || sourceNodeId === 'GLOBAL_SCOPE') {
    const globalRoutes = flow.get('global_intent_routes') as any;
    if (globalRoutes && Array.isArray(globalRoutes.items)) {
      const route = globalRoutes.items[routeIndex];
      if (route && typeof route.set === 'function') {
        let reviews = route.get('review_requests') as any;
        if (!reviews) {
          route.set('review_requests', doc.createNode([]));
          reviews = route.get('review_requests');
        }
        reviews.add(doc.createNode(request));
        return doc.toString();
      }
    }
  } else {
    const nodes = flow.get('nodes') as any;
    if (nodes && Array.isArray(nodes.items)) {
      for (const node of nodes.items) {
        if (node && typeof node.get === 'function' && node.get('id') === sourceNodeId) {
          const listKey = routeType === 'condition' ? 'condition_routes' : 'intent_routes';
          const routes = node.get(listKey) as any;
          if (routes && Array.isArray(routes.items)) {
            const route = routes.items[routeIndex];
            if (route && typeof route.set === 'function') {
              let reviews = route.get('review_requests') as any;
              if (!reviews) {
                route.set('review_requests', doc.createNode([]));
                reviews = route.get('review_requests');
              }
              reviews.add(doc.createNode(request));
              return doc.toString();
            }
          }
        }
      }
    }
  }

  return yamlContent;
}

/**
 * Sets a review request's resolved flag to the specified value in the YAML content.
 */
export function resolveReviewRequestInYaml(yamlContent: string, reviewId: string, resolved = true): string {
  const doc = YAML.parseDocument(yamlContent);
  if (!doc) return yamlContent;

  let modified = false;

  visit(doc, {
    Map(_, map) {
      const idNode = map.get('id');
      if (idNode && String(idNode) === reviewId) {
        map.set('resolved', resolved);
        modified = true;
        return visit.BREAK;
      }
    }
  });

  if (modified) {
    return doc.toString();
  }
  return yamlContent;
}

/**
 * Deletes a review request with the given ID from the YAML content.
 */
export function deleteReviewRequestInYaml(yamlContent: string, reviewId: string): string {
  const doc = YAML.parseDocument(yamlContent);
  if (!doc) return yamlContent;

  let modified = false;

  visit(doc, {
    Seq(_, seq) {
      const index = seq.items.findIndex(item => {
        if (isMap(item)) {
          const idNode = item.get('id');
          return idNode && String(idNode) === reviewId;
        }
        return false;
      });
      if (index !== -1) {
        seq.delete(index);
        modified = true;
        return visit.BREAK;
      }
    }
  });

  if (modified) {
    return doc.toString();
  }
  return yamlContent;
}




