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
import {Injectable} from '@angular/core';
import * as dagre from 'dagre';
import {BqQueryPlan} from './bq_query_plan';
import {QueryStage} from './rest_interfaces';

@Injectable({providedIn: 'root'})
export class DagreLayoutService {
  private hasNodeWithId(nodeList:QueryStage[], id:string|number) {
    return nodeList.find(node => node.id === id);
  }

  public layout(nodes: QueryStage[], bqPlan: BqQueryPlan) {
    const g = new dagre.graphlib.Graph();

    // define the key options: Top to bottom, and the separation increments
    g.setGraph({
      rankdir: 'TB',
      nodesep: 120,
      ranksep:120
    });
    //g.rankDir = 'TB';
    //g.nodesep = 120;
    //g.ranksep = 120;

    // Default to assigning a new object as a label for each new edge.
    g.setDefaultEdgeLabel(() => ({}));

    // set nodes
    for (const node of nodes) {
      const label = node.name.length > 22 ?
          `${node.name.slice(0, 10)}...${node.name.slice(-10)}` :
          node.name;
      g.setNode(node.id, {label: label, height: 50, width: 50});
    }
    // set edges, ignore edges that don't map tot he supplied nodes
    for (const edge of bqPlan.edges) {
      if (this.hasNodeWithId(nodes, edge.from.id) &&
          this.hasNodeWithId(nodes, edge.to.id)) {
        g.setEdge(edge.from.id, edge.to.id);
      }
    }
    dagre.layout(g);
    return g;
  }
}
