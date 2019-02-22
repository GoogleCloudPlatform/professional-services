import {ConstantPool} from '@angular/compiler/src/constant_pool';
import * as google from 'google-charts';
import {LogService} from './log.service';
import {Job, QueryStage, QueryStep} from './rest_interfaces';

interface Edge {
  from: QueryStage;
  to: QueryStage;
  outputName: string;
}

export class BqQueryPlan {
  readonly nodes: QueryStage[] = [];
  readonly edges: Edge[] = [];
  ganttChart: any;
  ganttData: any;

  constructor(public readonly plan: Job, private logSvc: LogService) {
    if (this.plan.statistics.query && this.plan.statistics.query.queryPlan) {
      this.nodes = this.plan.statistics.query.queryPlan;
    } else {
      logSvc.warn(`No query found in job ${this.plan.id}`);
    }

    // add ghost nodes and edges
    for (const node of this.nodes) {
      for (const sourceNodeId of this.getReads(node)) {
        // if the node does a read from a table then there is
        // no sourceNodeId. so we generate a ghost node
        if (!this.getNode(sourceNodeId)) {
          const ghostNode = {
            name: sourceNodeId,
            id: sourceNodeId,
            isExternal: true
          } as QueryStage;
          this.nodes.push(ghostNode);
        }
        // add an edge
        this.edges.push({
          from: this.getNode(sourceNodeId),
          to: node,
          outputName: node.name
        });
      }
    }
    for (const node of this.nodes) {
      this.improveNodeInfo(node);
    }
  }

  /** extract all node ids that are read from */
  private getReads(node: QueryStage): string[] {
    if (!node.steps) {
      // ghostNodes don't have steps
      return [];
    }
    const result = node.steps.filter(step => step.kind === 'READ')
                       .map(step => {
                         const readSubstep = step.substeps.find(substep => {
                           return substep.startsWith('FROM ');
                         });
                         const items = readSubstep.split(' ');
                         return items[1].startsWith('__') ? null : items[1];
                       })
                       .filter(item => item);
    // input steps are not real steps (as BQ thinks of it)
    // so they don't show up in the above filter.
    // but they are read from by definition
    // so they get added here
    if (node.inputStages) {
      result.push(...node.inputStages);
    }
    return result;
  }

  /**
   *  Process the raw node data to improve usability on display.
   *   This is simply formatted to JSON and displayed as-is
   */
  private improveNodeInfo(node: QueryStage): void {
    if (!node.startMs || !node.endMs) {
      return;
    }
    const stats = this.plan.statistics;
    const endMs = Number(node.endMs);
    const startMs = Number(node.startMs);
    const jobStartMs = Number(stats.startTime);
    const jobEndMs = Number(stats.endTime);
    if (isNaN(startMs) || isNaN(endMs) || isNaN(jobStartMs) ||
        isNaN(jobEndMs)) {
      return;
    }
    const duration = endMs - startMs;
    node['durationMs  '] = duration.toLocaleString('en');
    const startPct = (100 * (startMs - jobStartMs)) / (jobEndMs - jobStartMs);
    const endPct = (100 * (endMs - jobStartMs)) / (jobEndMs - jobStartMs);
    node['startTime   '] = new Date(startMs);
    node['endTime     '] = new Date(endMs);
    node['start %     '] = startPct.toLocaleString('en') + '% of job duration';
    node['end %       '] = endPct.toLocaleString('en') + '% of job duration';
  }

  /** find a node by its id */
  getNode(id: string): QueryStage {
    return this.nodes.find(x => x.id === id);
  }

  /** create a google gantt chart object */
  asGoogleGantt(
      containerName: string,
      onSelectHandler:
          (chart: google.GoogleCharts.Gantt, data: object) => void): void {
    const container = document.getElementById(containerName);
    if (!container) {
      this.logSvc.error(`Can't find container '${containerName}'`);
      return;
    }
    const data = new google.GoogleCharts.api.visualization.DataTable();
    data.addColumn('string', 'Task ID');
    data.addColumn('string', 'Task Name');
    data.addColumn('date', 'Start Date');
    data.addColumn('date', 'End Date');
    data.addColumn('number', 'Duration');
    data.addColumn('number', 'Percent Complete');
    data.addColumn('string', 'Dependencies');
    const internalNodes = this.nodes.filter(
        node => !node.hasOwnProperty('isExternal') || !node.isExternal);
    data.addRows(internalNodes.map(
        node =>
            [node.id, node.name, new Date(Number(node.startMs)),
             new Date(Number(node.endMs)), null, 100, null]));

    const options = {
      gantt: {
        criticalPathEnabled: true,
        criticalPathStyle: {stroke: '#e64a19', strokeWidth: 5},
        barHeight: 4
      },
      explorer: {keepInBounds: true, axis: 'vertical'}
    };

    const chart = new google.GoogleCharts.api.visualization.Gantt(container);
    chart.draw(data, options);
    if (onSelectHandler) {
      google.GoogleCharts.api.visualization.events.addListener(
          chart, 'select', none => {
            onSelectHandler(chart, data);
          });
    }
    this.ganttChart = chart;
    this.ganttData = data;
  }

  /**
   * Calculate the node background color, returning the one for the biggest
   * time.
   */
  private colorForMaxTime(node: QueryStage): string {
    if (node.waitMsAvg) {
      const timeList = [
        Number(node.waitMsAvg), Number(node.readMsAvg),
        Number(node.computeMsAvg), Number(node.waitMsAvg)
      ];
      const maxTime = Math.max(...timeList);
      const index = timeList.indexOf(maxTime);
      return ['#fbc02d', '#7b1fa2', '#ef6c00', '#1565c0'][index];
    } else {
      return '#2290FF';
    }
  }

  /** Return a formatted text of all details minus the steps. */
  getStageStats(node: QueryStage): string {
    const result = {};
    for (const key of Object.keys(node)) {
      if (key === 'steps') {
        continue;
      }
      result[key] = node[key];
    }
    return JSON.stringify(result, null, 4);
  }

  /** Return the formatted text of the steps. */
  getStepDetails(node: QueryStage): QueryStep[] {
    return node.steps ? node.steps : [];
  }
}
