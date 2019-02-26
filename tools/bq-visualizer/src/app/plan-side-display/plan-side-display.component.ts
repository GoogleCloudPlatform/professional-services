import {Component, Input, OnInit} from '@angular/core';

import {QueryStep} from '../rest_interfaces';

@Component({
  selector: 'app-plan-side-display',
  templateUrl: './plan-side-display.component.html',
  styleUrls: ['./plan-side-display.component.css']
})
export class PlanSideDisplayComponent {
  @Input() stepDetails: QueryStep[] = [];
  @Input() stageDetails: string = '';
}
