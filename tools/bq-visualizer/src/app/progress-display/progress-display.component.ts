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

import { Component, OnInit, ViewChild } from '@angular/core';
//import * as google from 'google.visualization';
import * as google from 'google-charts';
import { BqQueryPlan } from '../bq_query_plan';
import { LogService } from '../log.service';
import { PlanStatusCardComponent } from '../plan-status-card/plan-status-card.component';

@Component({
  selector: 'app-progress-display',
  templateUrl: './progress-display.component.html',
  styleUrls: ['./progress-display.component.css']
})
export class ProgressDisplayComponent implements OnInit {
  private plan: BqQueryPlan;
  private haveDoneDraw = false;

  @ViewChild('status_card') statusCard: PlanStatusCardComponent;

  constructor(private logSvc: LogService) { }

  ngOnInit() {
    google.GoogleCharts.load(() => { }, 'Progress');
  }


  async loadPlan(plan: BqQueryPlan) {
    this.haveDoneDraw = false;
    this.statusCard.loadPlan(plan);
    this.plan = plan;
  }

  async draw() {
    if (!this.plan) {
      return;
    }
    if (this.haveDoneDraw) return;
    this.drawProgressChart();
    this.haveDoneDraw = true;
  }

  drawProgressChart() {
    if (this.plan && this.plan.plan.statistics.query) {
      this.plan.asProgressChart(
        'Progress', (chart: google.GoogleCharts.AreaChart, data: any) => { });
      this.plan.asSlotUsageChart(
        'SlotUsage', (chart: google.GoogleCharts.LineChart, data: any) => { });
      this.plan.asRunnableUsageChart(
        'Runnable', (chart: google.GoogleCharts.LineChart, data: any) => { });
    } else {
      console.log('no Plan');
    }
  }

  resizeWindow(_: any) {
    this.drawProgressChart();
  }
}
