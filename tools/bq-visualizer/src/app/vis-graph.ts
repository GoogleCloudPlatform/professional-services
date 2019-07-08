/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export class VisGraph {
  network = null;
  options = {
    autoResize: true,
    height: '800px',
    width: '100%',
    edges: {
      arrows: {to: {enabled: true, scaleFactor: 1, type: 'arrow'}},
      selectionWidth: 5,
      color: {color: '#A0A0FF', highlight: '#8080FF'},
      smooth: true
    },
    nodes: {},
    physics: {
      enabled: true,
      barnesHut: {avoidOverlap: 1, gravitationalConstant: -200},
      hierarchicalRepulsion: {nodeDistance: 150}
    },
    layout: {
      hierarchical: {
        enabled: true,
        levelSeparation: 150,
        nodeSpacing: 300,
        treeSpacing: 200,
        blockShifting: true,
        edgeMinimization: true,
        parentCentralization: false,
        direction: 'UD',        // layout directin. options are UD, DU, LR, RL
        sortMethod: 'directed'  // hubsize if you like concentric layout. But
                                // directed seems better
      }
    }
  };

  setHierarchical(b): void {
    this.options.layout.hierarchical.enabled = b;
    if (this.network) {
      this.network.setOptions(this.options);
    }
  }

  setHierchicalSort(s): void {
    this.options.layout.hierarchical.sortMethod = s;
    if (this.network) {
      this.network.setOptions(this.options);
    }
  }
}
