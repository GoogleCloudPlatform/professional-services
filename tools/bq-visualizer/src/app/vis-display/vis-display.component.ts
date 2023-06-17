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
import {Component, AfterViewInit, ViewChild} from '@angular/core';
import * as vis from 'vis';

import {BqQueryPlan, Edge} from '../bq_query_plan';
import {DagreLayoutService} from '../dagre-layout.service';
import {LogService} from '../log.service';
import {PlanSideDisplayComponent} from '../plan-side-display/plan-side-display.component';
import {PlanStatusCardComponent} from '../plan-status-card/plan-status-card.component';
import {QueryStage} from '../rest_interfaces';

type ResizeCallback = (chart: TreeChart, params: object) => void;
type NodeSelectCallback =
    (chart: TreeChart, stage: QueryStage, params: object) => void;
type NodeDeselectCallback =
    (chart: TreeChart, stage: QueryStage, params: object) => void;
type EdgeSelectCallback = (chart: TreeChart, params: object, detail: object) =>
    void;
type EdgeDeselectCallback = (chart: TreeChart, params: object) => void;

@Component({
  selector: 'app-vis-display',
  templateUrl: './vis-display.component.html',
  styleUrls: ['./vis-display.component.css']
})
export class VisDisplayComponent implements AfterViewInit {
  public graph: TreeChart | null;
  private layout: any;  // dqagre layout result;
  private plan: BqQueryPlan | null;
  private haveDoneDraw = false;

  @ViewChild('status_card') statusCard: PlanStatusCardComponent;
  @ViewChild('side_display') sideDisplay: PlanSideDisplayComponent;

  constructor(
      private layoutSvc: DagreLayoutService, private logSvc: LogService) {}

  ngAfterViewInit() {
    this.statusCard.dislayOptionEvent.subscribe(
     (displayOption: string) => this.invalidateGraph()
    );
  }
  async loadPlan(plan: BqQueryPlan) {
    this.plan = plan;
    this.haveDoneDraw = false;
    this.statusCard.loadPlan(plan);
    this.sideDisplay.stepDetails = [];
    this.sideDisplay.stageDetails = [];
    this.clearGraph();
  }

  private invalidateGraph() {
    this.haveDoneDraw = false;
    this.draw();
  }

  async draw() {
    if (!this.plan) {
      this.clearGraph();
      return;
    }
    if (this.haveDoneDraw) {
      return;
    }

    this.graph = this.drawGraph(
        this.plan,
        (chart: TreeChart, resizeData: object) => {
             //console.log('canvas resize', this);
             //console.log(resizeData);
        },
        (chart: TreeChart, node: any, params: any) => {
          if (node) {
            this.sideDisplay.stageDetails = this.plan.getStageStats(node);
            this.sideDisplay.stepDetails = this.plan.getStepDetails(node);
          }
        });
    this.haveDoneDraw = true;
    this.resizeToWindow();
  }

  resizeWindow(event:any) {
    this.resizeToWindow();
  }

  private resizeToWindow(): void {
    if (this.graph && this.graph.network) {
      const newWidth = window.innerWidth * 0.74;
      const newHeight = window.innerHeight * 0.75;
      this.graph.network.setSize(`${newWidth}px`, `${newHeight}`);
      this.graph.network.redraw();
    }
  }

  private clearGraph() {
    if (this.graph) {
      this.graph.network.setData({nodes: new vis.DataSet([]), edges: new vis.DataSet([])});
      this.graph.network.redraw();
    }
  }
  private drawGraph(
      plan: BqQueryPlan, onResizeEvent?: ResizeCallback,
      onNodeSelect?: NodeSelectCallback, onNodeDeselect?: NodeDeselectCallback,
      onEdgeSelect?: EdgeSelectCallback,
      onEdgeDeselect?: EdgeDeselectCallback): TreeChart | null {
    let visnodes = new vis.DataSet<vis.Edge>([]);
    let visedges = new vis.DataSet<vis.Edge>([]);
    //console.log('plan.nodes')
    //console.log(plan.nodes)
    if (plan.nodes.length === 0) {
      this.logSvc.warn('Current Plan has no nodes.');
      return null;
    } else {
      const allnodes = (this.statusCard.stageDisplayOption ===
                        this.statusCard.SHOWREPARTIION) ?
          plan.nodes :
          plan.nodesWithoutRepartitions();

      const layout = this.layoutSvc.layout(allnodes, plan);

      const nodes = allnodes.map(node => {
        const label = node.name.length > 22 ?
            `${node.name.slice(0, 10)}...${node.name.slice(-10)}` :
            node.name;
        let node_color = '#D2E5FF'
        if (node.performanceInsights && node.performanceInsights.length>0){
          node_color =  '#f26a02'
        }
        node_color = node.status === 'RUNNING' ? '#FF8080' : node_color;
        return {
          id: node.id,
          label: label,
          title: node.name,
          widthConstraint: 60,
          shape: node.isExternal ? 'database' : 'box',
          color: node_color,
          physics: false,
          x: layout.node(node.id).x,
          y: layout.node(node.id).y
        };
      });
      visnodes = new vis.DataSet(nodes);
      visedges = new vis.DataSet(plan.edges.map(edge => {
        let nrRecords = edge.from.recordsWritten;
        if (nrRecords === undefined) {
          nrRecords = this.estimate_recordsRead(edge, plan).toString();
        }
        return {
          from: edge.from.id,
          to: edge.to.id,
          label: Number(nrRecords).toLocaleString('en') + ' records'
        };
      }));
    }
    const data = {nodes: visnodes, edges: visedges};
    const options = this.getVisOptions();

    const container = document.getElementById('visGraph');
    if (!container) {
      console.error(`Unable to find 'visGraph'`);
      return null;
    }

    // create a network
    const network = new vis.Network(container, data, options);
    const chart: TreeChart = {options: options, network: network};
    const me = this;
    if (onResizeEvent) {
      network.on('resize', params => {
        onResizeEvent(chart, params);
      });
    }
    if (onNodeSelect) {
      network.on('selectNode', params => {
        const id = params.nodes[0];
        const n = plan.getNode(id);
        onNodeSelect(chart, n, params);
      });
    }
    if (onNodeDeselect) {
      network.on('deselectNode', params => {
        onNodeDeselect(chart, params, plan.plan);
      });
    }
    if (onEdgeSelect) {
      network.on('selectEdge', params => {
        const edgeId = params.edges[0];
        const foundEdge:vis.Edge = visedges.get()[edgeId];
        const fromNode = plan.getNode(foundEdge.from);
        const toNode = plan.getNode(foundEdge.to);
        const detail = {
          label: fromNode.name + ' -> ' + toNode.name,
          from: fromNode.name,
          to: toNode.name,
          recordsWritten: fromNode.recordsWritten ? fromNode.recordsWritten :
                                                    toNode.recordsRead
        };
        onEdgeSelect(chart, params, detail);
      });
    }
    if (onEdgeDeselect) {
      network.on('deselectEdge', params => {
        onEdgeDeselect(chart, params);
      });
    }
    return chart;
  }

  /**
   * calculate an estimate of records processed in an edge.
   * @param edge
   */
  private estimate_recordsRead(edge: Edge, plan: BqQueryPlan): number {
    const targetNode = edge.to;
    const totalRecordsRead = Number(targetNode.recordsRead);

    const allIncomingEdges = plan.edges.filter(other_edge => {
      return (
          (other_edge.to.id === targetNode.id) &&
          (other_edge.from.id !== edge.from.id));
    });

    const all_record_reads = allIncomingEdges.map(edge => {
      return (edge.from.recordsWritten === undefined) ?
          '0' :
          edge.from.recordsWritten;
    });

    const total = all_record_reads.reduce((a, b) => a + Number(b), 0);
    const remainder = Number(targetNode.recordsRead) - total;

    return remainder;
  }
  private getVisOptions(): vis.Options {
    return {
      autoResize: false,
      width: '100%',
      edges: {
        arrows: {
          from: {enabled: false, scaleFactor: 1, type: 'arrow'},
          to: {enabled: true, scaleFactor: 1, type: 'arrow'}
        },
        selectionWidth: 5,
        color: {color: '#A0A0FF', highlight: '#8080FF'},
        smooth: {enabled: true, type: 'cubicBezier', roundness: 0.5}
      },
      nodes: {},

      physics: {
        enabled: false,
        barnesHut: {avoidOverlap: 1, gravitationalConstant: -200},
        hierarchicalRepulsion: {nodeDistance: 150}
      }
    };
  }
}
interface TreeChart {
  options: vis.Options;
  network: vis.Network;
}
