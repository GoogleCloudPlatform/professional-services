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

import {Component, ViewChild} from '@angular/core';
import {MatTabChangeEvent} from '@angular/material/tabs';

import {BqJob} from '../bq_job';
import {BqQueryPlan} from '../bq_query_plan';
import {JobComponent} from '../job/job.component';
import {ProgressDisplayComponent} from '../progress-display/progress-display.component';
import {TimingDisplayComponent} from '../timing-display/timing-display.component';
import {VisDisplayComponent} from '../vis-display/vis-display.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  title = 'BQ Visualizer';

  @ViewChild('tabs') tabGroup:any;
  @ViewChild('job') jobComponent: JobComponent;
  @ViewChild('tree') visComponent: VisDisplayComponent;
  @ViewChild('timing') timingComponent: TimingDisplayComponent;
  @ViewChild('progress') progressComponent: ProgressDisplayComponent;

  // adding the authservice here causes the application to invoke authentication
  // constructor(private authService: GoogleAuthService) {}
  constructor() {}

  async ngAfterViewInit() {
    this.jobComponent.planSelected.subscribe(async plan => {
      // Load the query plan into the display components.
      this.visComponent.loadPlan(plan);
      this.timingComponent.loadPlan(plan);
      this.progressComponent.loadPlan(plan);

      // Switch to the 'Tree' tab.
      this.tabGroup.selectedIndex = 1;
    });
    this.tabGroup.selectedTabChange.subscribe((tab: MatTabChangeEvent) => {
      switch (tab.index) {
        case 1:
          this.visComponent.draw();
          break;
        case 2:
          this.timingComponent.draw();
          break;
        case 3:
          this.progressComponent.draw();
          break;
      }
    }) 
  }
}
