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
import { SelectionModel } from '@angular/cdk/collections';
import  * as _  from "lodash"

import { BqQueryPlan, KeyValue, TableDetails } from '../bq_query_plan';
import { LogService } from '../log.service';

@Component({
  selector: 'app-plan-status-card',
  templateUrl: './plan-status-card.component.html',
  styleUrls: ['./plan-status-card.component.css']
})


export class PlanStatusCardComponent {
  plan: BqQueryPlan|null|undefined = null;
  errorMsgs: string|null = null;
  SHOWREPARTIION = 'showRepartition';
  HIDEREPARTITION = 'hideRepartition';
  stageDisplayOption = this.HIDEREPARTITION;
  dislayOptionEvent = new EventEmitter<string>();
  overviewColumns: string[] = ['overviewKey', 'overviewValue'];
  overview: KeyValue[] = [];
  tableColumns: string[] = ['tableId', 'unused', 'explanation'];
  tablesHeader: string[] = ['Table Name', 'Unused', 'Explanation']
  tables: TableDetails[] = [];
  statisticsColumns: string[] = ['statskey', 'statsvalue'];
  statistics: KeyValue[] = [];
  reservationsHeader: string[] = []
  reservationColumns: string[] = ['reservationKey', 'reservationValue'];
  reservation_data:KeyValue[] = [];
  settingsColumns: string[] = ['settingsKey', 'settingsValue'];
  settings_data: KeyValue[] = [];
  selection = new SelectionModel(true,[]);

 
  constructor(private logSvc: LogService) { }

  async loadPlan(plan: BqQueryPlan) {
    this.plan = plan;
    if (plan && plan.plan){
      if (plan.plan.status && plan.plan.status.errors){
        this.errorMsgs = JSON.stringify (plan.plan.status.errors, null,4);
      } else{
        this.errorMsgs=null
      }
      this.overview = this.mk_overview();
      this.statistics = this.mk_statistics();
      this.tables = this.mk_tables();
      this.reservation_data = this.mk_reservation_data();
      this.settings_data = this.mk_settings_data();
    } else{
      this.overview=[];
      this.errorMsgs=null
      this.statistics = [];
      this.tables=[];
      this.reservation_data = [];
      this.settings_data = [];
    }
  }

  changeStageDisplayOption(event: any) {
    this.dislayOptionEvent.emit(this.stageDisplayOption);
  }

  mk_settings_data(): KeyValue[] {
    if (this.plan && this.plan.plan.configuration && this.plan.plan.configuration.query) {
      const query_conf =this.plan.plan.configuration.query
      console.log('get settings data')
      const results = [
        new KeyValue({ key: 'useLegacySql', value: query_conf.useLegacySql? query_conf.useLegacySql.toString():"N/A" }),
        new KeyValue({ key: 'useQueryCache', value: query_conf.useQueryCache? 'true': 'false' }),
        new KeyValue({ key: 'write disposition', value: query_conf.writeDisposition }),
        new KeyValue({ key: 'destination table', 
        value: query_conf.destinationTable? query_conf.destinationTable.tableId:'' }),
        new KeyValue({ key: 'destination dataSet', 
        value:query_conf.destinationTable?  query_conf.destinationTable.datasetId: '' }),
        new KeyValue({ key: 'destination project', 
        value: query_conf.destinationTable? query_conf.destinationTable.projectId:'' }),
        new KeyValue({ key: 'priority', value: query_conf.priority })
      ]
      return results
    }
    return [];
  }

  get sql(): string {
    if (this.plan && this.plan.plan && this.plan.plan.configuration && this.plan.plan.configuration.query) {
      return this.plan.plan.configuration.query.query;
    }
    return 'No Query to display';
  }

  /* Return a formatted view of general information from the query plan. */
  mk_overview(): KeyValue[] {
    if (this.plan) {
      const configuration = this.plan.plan.configuration;
      console.log('get overview data')

      const jobRef =  this.plan.plan.jobReference;
      const data = [
        new KeyValue({ key: 'job type', value: configuration ? configuration.jobType : '' }),
        new KeyValue({ key: 'etag', value: this.plan.plan.etag }),
        new KeyValue({ key: 'user email', value: this.plan.plan.user_email }),
        new KeyValue({ key: 'principal subject', value: this.plan.plan.principal_subject? this.plan.plan.principal_subject:''}),
        new KeyValue({ key: 'job id', value: jobRef?jobRef.jobId: 'N/A' }),
        new KeyValue({ key: 'location', value: jobRef?jobRef.location: 'N/A' }),
        new KeyValue({ key: 'project id', value: jobRef?jobRef.projectId: 'N/A' }),
        new KeyValue({ key: 'status', value: this.plan.plan.status ? this.plan.plan.status.state : 'None' })
      ];
      if (configuration) {
        for (let ckey in configuration.labels) {
          data.push(new KeyValue({ key: 'label: ' + ckey, value: configuration.labels[ckey] }));
        }
      }
      return data
    }
    return [];
  }


  /**  Provide statistics of qp minus the queryplan part. */
  mk_statistics(): KeyValue[] {
  
    let result: KeyValue[] = [];
    console.log('get statistics data')
    if (this.plan) {
      const stats = this.plan.plan.statistics;
      const duration = Number(stats.endTime) - Number(stats.startTime);
      const slots = stats.query ?
        Math.ceil(Number(stats.query.totalSlotMs) / duration)
          .toLocaleString('en') :
        'n/a';

      result = [
        new KeyValue({ key: 'creationTime', value: new Date(Number(stats.creationTime)).toLocaleString('en') }),
        new KeyValue({ key: 'startTime', value: new Date(Number(stats.startTime)).toLocaleString('en') }),
        new KeyValue({ key: 'endTime', value: new Date(Number(stats.endTime)).toLocaleString('en') }),
        new KeyValue({ key: 'elapsedMs', value: duration.toLocaleString('en') }),
        new KeyValue({ key: 'estd. slots used', value: slots }),
        new KeyValue({
          key: 'totalSlotMs', value: stats.query ?
            Number(stats.query.totalSlotMs).toLocaleString('en') :
            'n/a'
        }),
        new KeyValue({
          key: 'billingTier', value: stats.query ?
            Number(stats.query.billingTier).toLocaleString('en') :
            'n/a'
        }),
        new KeyValue({
          key: 'cacheHit', value: stats.query && stats.query.cacheHit ?
            stats.query.cacheHit.toString() :
            'n/a'
        }),
        new KeyValue({
          key: 'estimatedBytesProcessed', value: stats.query ?
            Number(stats.query.estimatedBytesProcessed).toLocaleString('en') :
            'n/a'
        }),
        new KeyValue({
          key: 'totalBytesProcessed', value: stats.query ?
            Number(stats.query.totalBytesProcessed).toLocaleString('en') :
            'n/a'
        }),
        new KeyValue({
          key: 'totalBytesBilled', value: stats.query ?
            Number(stats.query.totalBytesBilled).toLocaleString('en') :
            'n/a'
        }),
        new KeyValue({
          key: 'totalPartitionsProcessed', value: stats.query ?
            Number(stats.query.totalPartitionsProcessed).toLocaleString('en') :
            'n/a'
        }),
        new KeyValue({ key: 'reservation Id', value: stats.reservation_id }),
      ];

    }
    return result;
  }

  /** reservation data for a key value style display */
  mk_reservation_data(): KeyValue[] {
    console.log('get reservation data')
    if (this.plan == null) {
      return []
    }
    const stats = this.plan.plan.statistics;
    this.reservationsHeader = [stats.reservation_id, 'SlotMs'];
    let usage: KeyValue[] = [
      new KeyValue({
        key: 'total', value: stats.query ?
          Number(stats.query.totalSlotMs).toLocaleString('en') : 'n/a'
      })
    ];
    if (stats.reservationUsage) {
      stats.reservationUsage.forEach((element) => {
        usage.push(new KeyValue({ key: element.name, value: Number(element.slotMs).toLocaleString('en') }));
      })
    }
    //console.log(usage)
    return usage;

  }

  /** Get referenced tables from query plan. Merge in meta data */
  mk_tables(): TableDetails[] {
    
    if (this.plan) {
      return this.plan.table_usage();
    } else {
      return [];
    }
      
  }
 
}
