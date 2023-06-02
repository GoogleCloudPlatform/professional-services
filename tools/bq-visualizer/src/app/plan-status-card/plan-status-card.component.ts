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
import { Component, OnInit } from '@angular/core';
import { EventEmitter } from '@angular/core';

import { BqQueryPlan, KeyValue } from '../bq_query_plan';
import { LogService } from '../log.service';

@Component({
  selector: 'app-plan-status-card',
  templateUrl: './plan-status-card.component.html',
  styleUrls: ['./plan-status-card.component.css']
})
export class PlanStatusCardComponent {
  plan: BqQueryPlan;
  SHOWREPARTIION = 'showRepartition';
  HIDEREPARTITION = 'hideRepartition';
  stageDisplayOption = this.HIDEREPARTITION;
  dislayOptionEvent = new EventEmitter<string>();
  tableColumns : string[] = ['tableName'];
  statisticsColumns: string[] = ['statskey', 'statsvalue'];
  reservationsHeader: string[] = []
  reservationColumns: string[] = ['key', 'value'];

   
  constructor(private logSvc: LogService) { }

  async loadPlan(plan: BqQueryPlan) {
    this.plan = plan;
  }

  changeStageDisplayOption(event: any) {
    this.dislayOptionEvent.emit(this.stageDisplayOption);
  }
  get settings(): string {
    if (this.plan && this.plan.plan.configuration.query) {
      const results = {
        useLegacySql: this.plan.plan.configuration.query.useLegacySql,
        useQueryCache: this.plan.plan.configuration.query.useQueryCache,
        writeDisposition: this.plan.plan.configuration.query.writeDisposition,
        destinationTable: this.plan.plan.configuration.query.destinationTable,
        createDisposition: this.plan.plan.configuration.query.createDisposition
      };
      return JSON.stringify(results, null, 4);
    }
    return 'No Query Settings to display';
  }

  get sql(): string {
    if (this.plan && this.plan.plan.configuration.query) {
      return this.plan.plan.configuration.query.query;
    }
    return 'No Query to display';
  }

  /* Return a formatted view of general information from the query plan. */
  get overview(): string {
    if (this.plan) {
      const results = {
        etag: this.plan.plan.etag,
        id: this.plan.plan.id,
        jobId: this.plan.plan.jobReference.jobId,
        projectId: this.plan.plan.jobReference.projectId,
        status: this.plan.plan.status
      };
      return JSON.stringify(results, null, 4);
    }
    return 'No Overview to display';
  }

  /** Provide statistics of qp minus the queryplan part. */
  get statistics(): string {
    if (this.plan) {
      const stats = this.plan.plan.statistics;
      const duration = Number(stats.endTime) - Number(stats.startTime);
      const slots = stats.query ?
        Math.ceil(Number(stats.query.totalSlotMs) / duration)
          .toLocaleString('en') :
        'n/a';

      const results = {
        'creationTime            ': new Date(Number(stats.creationTime)),
        'startTime               ': new Date(Number(stats.startTime)),
        'endTime                 ': new Date(Number(stats.endTime)),
        'elapsedMs               ': duration.toLocaleString('en'),
        'estd. slots used        ': slots,
        'totalSlotMs             ': stats.query ?
          Number(stats.query.totalSlotMs).toLocaleString('en') :
          'n/a',
        'billingTier             ': stats.query ?
          Number(stats.query.billingTier).toLocaleString('en') :
          'n/a',
        'cacheHit                ': stats.query && stats.query.cacheHit ?
          stats.query.cacheHit.toString() :
          'n/a',
        'estimatedBytesProcessed ': stats.query ?
          Number(stats.query.estimatedBytesProcessed).toLocaleString('en') :
          'n/a',
        'totalBytesProcessed     ': stats.query ?
          Number(stats.query.totalBytesProcessed).toLocaleString('en') :
          'n/a',
        'totalBytesBilled        ': stats.query ?
          Number(stats.query.totalBytesBilled).toLocaleString('en') :
          'n/a',
        'totalPartitionsProcessed': stats.query ?
          Number(stats.query.totalPartitionsProcessed).toLocaleString('en') :
          'n/a',
        'reservation Id          ': stats.reservation_id,


      };

      return JSON.stringify(results, null, 4);
    }
    return 'No Timings to display';
  }

  get statistics_data(): KeyValue[] {
    let result: KeyValue[] = [];
    if (this.plan) {
      const stats = this.plan.plan.statistics;
      const duration = Number(stats.endTime) - Number(stats.startTime);
      const slots = stats.query ?
        Math.ceil(Number(stats.query.totalSlotMs) / duration)
          .toLocaleString('en') :
        'n/a';

      result = [
        new KeyValue({key: 'creationTime', value:new Date(Number(stats.creationTime)).toLocaleString('en')}),
        new KeyValue({key: 'startTime', value:new Date(Number(stats.startTime)).toLocaleString('en')}),
        new KeyValue({key: 'endTime', value:new Date(Number(stats.endTime)).toLocaleString('en')}),
        new KeyValue({key: 'elapsedMs', value:duration.toLocaleString('en')}),
        new KeyValue({key: 'estd. slots used', value:slots}),
        new KeyValue({key: 'totalSlotMs', value:stats.query ?
          Number(stats.query.totalSlotMs).toLocaleString('en') :
          'n/a'}),
          new KeyValue({key: 'billingTier', value:stats.query ?
          Number(stats.query.billingTier).toLocaleString('en') :
          'n/a'}),
          new KeyValue({key: 'cacheHit', value:stats.query && stats.query.cacheHit ?
          stats.query.cacheHit.toString() :
          'n/a'}),
          new KeyValue({key: 'estimatedBytesProcessed', value:stats.query ?
          Number(stats.query.estimatedBytesProcessed).toLocaleString('en') :
          'n/a'}),
          new KeyValue({key: 'totalBytesProcessed', value:stats.query ?
          Number(stats.query.totalBytesProcessed).toLocaleString('en') :
          'n/a'}),
          new KeyValue({key: 'totalBytesBilled', value:stats.query ?
          Number(stats.query.totalBytesBilled).toLocaleString('en') :
          'n/a'}),
          new KeyValue({key: 'totalPartitionsProcessed', value:stats.query ?
          Number(stats.query.totalPartitionsProcessed).toLocaleString('en') :
          'n/a'}),
          new KeyValue({key: 'reservation Id', value:stats.reservation_id}),
      ];
 
    }
    return result;
  }

  /** reservation data for a key value style display */
  get reservation_data(): KeyValue[] {
    // console.log('get reservation data')
    if (this.plan == null) {
      return []
    }
    const stats = this.plan.plan.statistics;
    this.reservationsHeader=[stats.reservation_id,  'SlotMs'];
    let usage: KeyValue[] = [
      //new KeyValue({ key: 'reservation: '+ stats.reservation_id, value:'SlotMs' }),
      new KeyValue({key:'total', value: stats.query ?
            Number(stats.query.totalSlotMs).toLocaleString('en') :'n/a'})
    ];
    if (stats.reservationUsage) {
      stats.reservationUsage.forEach((element) => {
        usage.push(new KeyValue({ key: element.name, value: Number(element.slotMs).toLocaleString('en') }));
      })
    } 
    //console.log(usage)
    return usage;

  }

  /** Get referenced tables from query plan. */
  get tables(): string[] {
    if (this.plan) {
      if (this.plan.plan.statistics.query) {
        const tables = this.plan.plan.statistics.query.referencedTables;
        var tableRefs: string[] = [];
        tables.forEach((element) => {
          tableRefs.push(`${element.projectId}.${element.datasetId}.${element.tableId}`);
        })
        return tableRefs;
      } else {
        return [];
      }
    }
    return ['No table statistics to display'];
  }

  /** display settings */
}
