import {Component, OnInit, ViewChild} from '@angular/core';
import * as google from 'google-charts';

import {BqQueryPlan} from '../bq_query_plan';
import {LogService} from '../log.service';
import {PlanStatusCardComponent} from '../plan-status-card/plan-status-card.component';

@Component({
  selector: 'app-progress-display',
  templateUrl: './progress-display.component.html',
  styleUrls: ['./progress-display.component.css']
})
export class ProgressDisplayComponent implements OnInit {
  private plan: BqQueryPlan;
  private haveDoneDraw = false;

  @ViewChild('status_card') statusCard: PlanStatusCardComponent;

  constructor(private logSvc: LogService) {}

  ngOnInit() {
    google.GoogleCharts.load(() => {}, 'Progress');
  }


  async loadPlan(plan: BqQueryPlan) {
    console.log('progress:loadPlan');
    if (plan) {
      console.log(plan.plan.statistics.query.timeline);
    }
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
    console.log('drawProgressChart');
    if (this.plan) {
      this.plan.asProgressChart(
          'Progress', (chart: google.GoogleCharts.AreaChart, data: any) => {});
    } else {
      console.log('no Plan');
    }
  }

  resizeWindow(_: any) {
    this.drawProgressChart();
  }
}
