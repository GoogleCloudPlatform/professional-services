import {Component, Input, OnInit} from '@angular/core';

import {QueryStep} from '../rest_interfaces';

/**
 * Display step details in an easy to read fashion
 */
@Component({
  selector: 'app-step-details',
  templateUrl: './step-details.component.html',
  styleUrls: ['./step-details.component.css']
})

export class StepDetailsComponent {
  @Input('details') steps: QueryStep[] = [];
}
