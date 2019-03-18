import {Injectable} from '@angular/core';
import * as dagre from 'dagre';
import {BqQueryPlan} from './bq_query_plan';

@Injectable({providedIn: 'root'})
export class DagreLayoutService {
  public layout(bqPlan: BqQueryPlan) {
    const g = new dagre.graphlib.Graph();

    // define the key options: Top to bottom, and the separation increments
    g.setGraph({});
    g.rankDir = 'TB';
    g.nodesep = 120;
    g.ranksep = 120;

    // Default to assigning a new object as a label for each new edge.
    g.setDefaultEdgeLabel(() => ({}));

    // set nodes
    for (const node of bqPlan.nodes) {
      const label = node.name.length > 22 ?
          `${node.name.slice(0, 10)}...${node.name.slice(-10)}` :
          node.name;
      g.setNode(node.id, {label: label, height: 50, width: 50});
    }
    // set edges
    for (const edge of bqPlan.edges) {
      g.setEdge(edge.from.id, edge.to.id);
    }
    dagre.layout(g);
    return g;
  }
}
