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
import {Component, OnInit, ViewChild} from '@angular/core';

//import * as google from 'google.visualization';
import * as google from 'google-charts';

import {BqQueryPlan} from '../bq_query_plan';
import {LogService} from '../log.service';
import {PlanSideDisplayComponent} from '../plan-side-display/plan-side-display.component';
import {PlanStatusCardComponent} from '../plan-status-card/plan-status-card.component';
import {QueryPlanService} from '../query-plan.service';
import {QueryStep} from '../rest_interfaces';

@Component({
  selector: 'app-timing-display',
  templateUrl: './timing-display.component.html',
  styleUrls: ['./timing-display.component.css']
})
export class TimingDisplayComponent implements OnInit {
  public selectedStageStats = '<empty>';
  public selectedStageStepDetails: QueryStep[] = [];
  private plan: BqQueryPlan;
  private haveDoneDraw = false;

  @ViewChild('status_card') statusCard: PlanStatusCardComponent;
  @ViewChild('side_display') sideDisplay: PlanSideDisplayComponent;

  constructor(private logSvc: LogService) {}

  ngOnInit() {
    google.GoogleCharts.load(() => {}, 'gantt');
  }

  async loadPlan(plan: BqQueryPlan) {
    this.haveDoneDraw = false;
    this.statusCard.loadPlan(plan);
    this.sideDisplay.stepDetails = [];
    this.sideDisplay.stageDetails = [];
    this.plan = plan;
  }

  async draw() {
    if (!this.plan) {
      const gantt = document.getElementById('Gantt');
      if (gantt && gantt.childNodes.length > 0) {
        gantt.removeChild(gantt.childNodes[0]);
      }
      return;
    }
    if (this.haveDoneDraw) return;
    this.drawGantt();
    this.haveDoneDraw = true;
  }

  drawGantt(): void {
    if (this.plan) {
      this.plan.asGoogleGantt(
          'Gantt', (chart: google.GoogleCharts.Gantt, data: any) => {
            const selection = chart.getSelection();
            if (selection.length) {
              const row = selection[0].row;
              const nodeId = data.getValue(row, 0);
              const node = this.plan.getNode(nodeId);
              if (node !== null) {
                this.sideDisplay.stageDetails = this.plan.getStageStats(node);
                this.sideDisplay.stepDetails = this.plan.getStepDetails(node);
              }
            }
          });
    }
  }

  resizeWindow(_: any) {
    this.drawGantt();
  }
}
