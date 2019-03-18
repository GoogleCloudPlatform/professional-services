import {Component, OnInit, ViewChild} from '@angular/core';
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
  public selectedStageStats: string = '<empty>';
  public selectedStageStepDetails: QueryStep[] = [];
  private plan: BqQueryPlan;
  private haveDoneDraw: boolean = false;

  @ViewChild('status_card') statusCard: PlanStatusCardComponent;
  @ViewChild('side_display') sideDisplay: PlanSideDisplayComponent;

  constructor(private logSvc: LogService) {}

  ngOnInit() {
    google.GoogleCharts.load(() => {}, 'gantt');
  }

  async loadPlan(plan: BqQueryPlan) {
    this.statusCard.loadPlan(plan);
    this.sideDisplay.stepDetails = [];
    this.sideDisplay.stageDetails = '';
    this.plan = plan;
  }

  async draw() {
    if (!this.plan) return;
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
