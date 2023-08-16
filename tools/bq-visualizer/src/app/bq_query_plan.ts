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
//import {ConstantPool} from '@angular/compiler/src/constant_pool';
//import * as google from 'google-charts';
//import * as google from 'google.visualization';
import * as google from 'google-charts';
import * as _ from 'lodash';

import { LogService } from './log.service';
import { Job, QueryStage, QueryStep } from './rest_interfaces';


export interface Edge {
  from: QueryStage;
  to: QueryStage;
  outputName: string;
}
export interface OnSelectHandler<T> {
  (chart: T, data: object): void;
}

type KeyValueData = {
  key: string;
  value: string
}

export class KeyValue {
  key: string;
  value: string
  constructor(data: KeyValueData) {
    this.key = data.key;
    this.value = data.value;
  }
}


export class TableDetails{
  tableId: string;
  reason: string;
  explanation: string;
  constructor(data: TableDetails) {
    this.tableId = data.tableId;
    this.reason = data.reason;
    this.explanation = data.explanation;
  }
}

export class BqQueryPlan {
  readonly nodes: QueryStage[] = [];
  readonly edges: Edge[] = [];
  ganttChart: any;
  ganttData: any;
  progressChart: any;
  progressData: any;
  isValid = true;

  constructor(public readonly plan: Job, private logSvc: LogService) {
    if (!plan.hasOwnProperty('kind')) {
      logSvc.warn('No plan document found in job.');
      this.isValid = false;
      return;
    }
    if (!plan.kind.startsWith('bigquery')) {
      logSvc.warn(`Retrieved document is not of kind bigquery but of kind ${plan.kind}.`);
      return;
    }
    this.plan = plan;
    if (this.plan.statistics.query && this.plan.statistics.query.queryPlan) {
      this.nodes = this.plan.statistics.query.queryPlan;
    } else {
      logSvc.warn(`No query found in job ${this.plan.id}`);
      return;
    }
    this.isValid = true;

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

  /** return nodes minus repartition typwe nodes */
  public nodesWithoutRepartitions() {
    return this.nodes.filter(node => (node.name.indexOf('Repartition') < 0));
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
    // check for performance info in stats
    if (stats.query && stats.query.performanceInsights){
      const insights = stats.query.performanceInsights
      if (insights.stagePerformanceStandaloneInsights){
      let standaloneInsights = insights.stagePerformanceStandaloneInsights.filter((v)=>{return v.stageId==node.id});
      node.performanceInsights = standaloneInsights
     
      }
    }

    if (isNaN(startMs) || isNaN(endMs) || isNaN(jobStartMs) ||
      isNaN(jobEndMs)) {
      return;
    }
  }

  /** find a node by its id */
  getNode(id: string | number): QueryStage | undefined {
    if (typeof (id) == 'number') { id = "" + id }
    return this.nodes.find(x => x.id === id);
  }
   

  /** create a google gantt chart object */
  asGoogleGantt(
    containerName: string,
    onSelectHandler: OnSelectHandler<google.GoogleCharts.Gantt>
  ): void {
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
        criticalPathStyle: { stroke: '#e64a19', strokeWidth: 5 },
        barHeight: 4
      },
      height: internalNodes.length * 20,
      explorer: { keepInBounds: true, axis: 'vertical' }
    };

    const chart = new google.GoogleCharts.api.visualization.Gantt(container);
    chart.draw(data, options);
    if (onSelectHandler) {
      google.GoogleCharts.api.visualization.events.addListener(
        chart, 'select', (none: any) => {
          onSelectHandler(chart, data);
        });
    }
    this.ganttChart = chart;
    this.ganttData = data;
  }

  /** visualize the progress data */
  asProgressChart(
    containerName: string,
    onSelectHandler: OnSelectHandler<google.GoogleCharts.AreaChart>
  ): void {
    const container = document.getElementById(containerName);
    if (!container) {
      this.logSvc.error(`Can't find container '${containerName}'`);
      return;
    }
    const data = new google.GoogleCharts.api.visualization.DataTable();
    const chart =
      new google.GoogleCharts.api.visualization.AreaChart(container);
    data.addColumn('date', 'time');
    data.addColumn('number', 'Completed Units');
    data.addColumn('number', 'Active Units');
    data.addColumn('number', 'Pending Units'); 

    // get the time data, ignore last entry as it often is an invalid data point
    const timeline = this.plan.statistics.query.timeline.slice(
      0, this.plan.statistics.query.timeline.length - 1);
    data.addRows(timeline.map(
      item =>
        [new Date(
          Number(item.elapsedMs) +
          Number(this.plan.statistics.startTime)),
        Number(item.completedUnits), Number(item.activeUnits),
        Number(item.pendingUnits)]));
    const options = {
      isStacked: true,
      legend: { position: 'bottom' },
      connectSteps: false,
      colors: ['#4374E0', '#53A8FB', '#F1CA3A', '#E49307'],
      title: 'Work Completion Progress'
    };
    chart.draw(data, options);
    if (onSelectHandler) {
      google.GoogleCharts.api.visualization.events.addListener(
        chart, 'select', (none: any) => {
          onSelectHandler(chart, data);
        });
    }
    this.progressChart = chart;
    this.progressData = data;
  }
  /**Visualise progress slot usage */
  asSlotUsageChart(
    containerName: string,
    onSelectHandler: OnSelectHandler<google.GoogleCharts.AreaChart>
  ): void {
    const container = document.getElementById(containerName);
    if (!container) {
      this.logSvc.error(`Can't find container '${containerName}'`);
      return;
    }
    const data = new google.GoogleCharts.api.visualization.DataTable();
    data.addColumn('date', 'time');
    data.addColumn('number', 'estd Slots');
    const chart =
      new google.GoogleCharts.api.visualization.LineChart(container);

    // calculate the slot usage
    const left = this.plan.statistics.query.timeline.slice(1);
    const right = this.plan.statistics.query.timeline.slice(0,
      this.plan.statistics.query.timeline.length - 1);
    const pairs = _.zip(right, left);


    data.addRows(pairs.map(
      item =>
        [new Date(
          Number(item[0].elapsedMs) +
          Number(this.plan.statistics.startTime)),
        Math.max(
          0,
          (Number(item[0].totalSlotMs) - Number(item[1].totalSlotMs)) /
          (Number(item[0].elapsedMs) -
            Number(item[1].elapsedMs)))]));
    const options = {
      isStacked: true,
      legend: { position: 'bottom' },
      connectSteps: false,
      colors: ['#4374E0', '#53A8FB', '#F1CA3A', '#E49307'],
      title: 'Estimated Slot Usage'
    };
    chart.draw(data, options);
    if (onSelectHandler) {
      google.GoogleCharts.api.visualization.events.addListener(
        chart, 'select', (none: any) => {
          onSelectHandler(chart, data);
        });
    }
  } 

  /**Visualise metric estimatedRunnableUnits */
  asRunnableUsageChart(
    containerName: string,
    onSelectHandler: OnSelectHandler<google.GoogleCharts.AreaChart>
  ): void {
    const container = document.getElementById(containerName);
    if (!container) {
      this.logSvc.error(`Can't find container '${containerName}'`);
      return;
    }
    if (!this.plan.statistics.query?.timeline){
      return;
    }
    const data = new google.GoogleCharts.api.visualization.DataTable();
    data.addColumn('date', 'time');
    data.addColumn('number', 'estimated runnable units');
    const chart =
      new google.GoogleCharts.api.visualization.LineChart(container);

      const timeline = this.plan.statistics.query.timeline.slice(
        0, this.plan.statistics.query.timeline.length - 1);
    
      data.addRows(timeline.map(
      item =>
        [new Date(
          Number(item.elapsedMs) +
          Number(this.plan.statistics.startTime)),
          Number(item.estimatedRunnableUnits)]));
    const options = {
      isStacked: true,
      legend: { position: 'bottom' },
      connectSteps: false,
      colors: ['#4374E0', '#53A8FB', '#F1CA3A', '#E49307'],
      title: 'Estimated Runnable Units'
    };
    chart.draw(data, options);
    if (onSelectHandler) {
      google.GoogleCharts.api.visualization.events.addListener(
        chart, 'select', (none: any) => {
          onSelectHandler(chart, data);
        });
    }
  } 

  /** Return stage details details minus the steps. */
  getStageStats(node: QueryStage): KeyValueData[] {
    //return this.formatStageStats(node);
    if (node.isExternal) {
      return [new KeyValue({ key: 'name', value: node.id }),]
    }
    const stats = this.plan.statistics
    const endMs = Number(node.endMs);
    const startMs = Number(node.startMs);
    const jobStartMs = Number(stats.startTime);
    const jobEndMs = Number(stats.endTime);


    let result = [
      new KeyValue({ key: 'id', value: node.id }),
      new KeyValue({ key: 'name', value: node.name }),
      new KeyValue({ key: 'status', value: node.status }),
      new KeyValue({ key: 'input stages', value: node.inputStages ? node.inputStages.toLocaleString() : 'n/a' }),
      new KeyValue({ key: 'parallelInputs', value: Number(node.parallelInputs).toLocaleString('en') }),
      new KeyValue({ key: 'completed', value: Number(node.completedParallelInputs).toLocaleString('en') }),
      new KeyValue({ key: 'recordsRead    ', value: Number(node.recordsRead).toLocaleString('en') }),
      new KeyValue({ key: 'shuffleOutputBytes', value: Number(node.shuffleOutputBytes).toLocaleString('en') }),
      new KeyValue({ key: 'shuffleOutputBytesSpilled', value: Number(node.shuffleOutputBytesSpilled).toLocaleString('en') }),
      new KeyValue({ key: 'recordsWritten ', value: Number(node.recordsWritten).toLocaleString('en') }),
      new KeyValue({
        key: 'wait (ms)', value: 'avg: ' + Number(node.waitMsAvg).toLocaleString('en') +
          ' max: ' + Number(node.waitMsMax).toLocaleString('en')
      }),
      new KeyValue({
        key: 'read (ms)', value: 'avg: ' + Number(node.readMsAvg).toLocaleString('en') +
          ' max: ' + Number(node.readMsMax).toLocaleString('en')
      }),
      new KeyValue({
        key: 'compute (ms)', value: 'avg: ' + Number(node.computeMsAvg).toLocaleString('en') +
          ' max: ' + Number(node.computeMsMax).toLocaleString('en')
      }),
      new KeyValue({
        key: 'write (ms)', value: 'avg: ' + Number(node.writeMsAvg).toLocaleString('en') +
          ' max: ' + Number(node.writeMsMax).toLocaleString('en')
      }),

    ]

    if (!isNaN(startMs) && !isNaN(endMs) && !isNaN(jobStartMs) &&
      !isNaN(jobEndMs)) {
      const duration = endMs - startMs;
      const slotMs = Number(_.get(node, 'slotMs', 0));
      result.push(new KeyValue({ key: 'slotMs', value: slotMs.toLocaleString('en') }));
      
      result.push(new KeyValue({ key: 'avg slots', value: (slotMs / duration).toLocaleString('en') }));
      const startPct = (100 * (startMs - jobStartMs)) / (jobEndMs - jobStartMs);
      const endPct = (100 * (endMs - jobStartMs)) / (jobEndMs - jobStartMs);
      result.push(new KeyValue({ key: 'startTime', value: new Date(startMs).toLocaleString('en') }));
      result.push(new KeyValue({ key: 'endTime', value: new Date(endMs).toLocaleString('en') }));
      result.push(new KeyValue({
        key: 'duration', value: startPct.toLocaleString('en') + '% - ' +
          endPct.toLocaleString('en') + '%'
      }));
    }
    // performance insights
    if (node.performanceInsights){
      node.performanceInsights.map((insight) => {
        if (insight.insufficientShuffleQuota){
          result.push(new KeyValue({key:"performance", value:"Insufficient Shuffle Quota"}));
        }
        if (insight.slotContention){
          result.push(new KeyValue({key:"performance", value:"Slot Contention"}));
        }
    })
    }
    return result
  }

  /**  Provide a list of tables used in the queries, merged with Meta Data insights */
  table_usage(): TableDetails[] {
    if (this.plan && this.plan.statistics.query && this.plan.statistics.query.referencedTables) {
      console.log('get table data')
      const tables = this.plan.statistics.query.referencedTables;
      const metaData = this.plan.statistics.query.metadataCacheStatistics;
      var tableRefs: TableDetails[] = [];
      tables.forEach((tableRef) => {
        const table_id =`${tableRef.projectId}.${tableRef.datasetId}.${tableRef.tableId}`;
        const to_push = new TableDetails({
          tableId: table_id,
          reason:  '',
          explanation: ''});
        // Merge in meta data if available        
        if (metaData && metaData.tableMetadataCacheUsage){
          metaData.tableMetadataCacheUsage.forEach(element => {
            if ((element.tableReference.projectId == tableRef.projectId) &&
                (element.tableReference.datasetId == tableRef.datasetId) && 
                (element.tableReference.tableId == tableRef.tableId)){
                to_push['reason'] = element.unusedReason || '';
                to_push['explanation'] = element.explanation || '';
                return;
            }
          })
        }
        tableRefs.push(to_push);
      })
      tableRefs.sort((r1, r2)=> {
        if (r1.tableId > r2.tableId)
          return 1
        else if (r1.tableId < r2.tableId)
          return -1
        else return 0
      });
      return tableRefs;
    } else {
      return [];
    }  
  }

  /** Return the formatted text of the steps. */
  getStepDetails(node: QueryStage): QueryStep[] {
    return node.steps ? node.steps : [];
  }
}
