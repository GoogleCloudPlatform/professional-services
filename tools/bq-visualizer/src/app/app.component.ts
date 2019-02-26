import {Component, ViewChild} from '@angular/core';
import {MatTabChangeEvent} from '@angular/material/tabs';

import {BqJob} from './bq_job';
import {BqQueryPlan} from './bq_query_plan';
import {GoogleAuthService} from './google-auth.service';
import {JobComponent} from './job/job.component';
import {TimingDisplayComponent} from './timing-display/timing-display.component';
import {VisDisplayComponent} from './vis-display/vis-display.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'BQ Visualizer';

  @ViewChild('tabs') tabGroup;
  @ViewChild('job') jobComponent: JobComponent;
  @ViewChild('tree') visComponent: VisDisplayComponent;
  @ViewChild('timing') timingComponent: TimingDisplayComponent;

  // adding the authservice here causes the application to invoke authentication
  constructor(private authService: GoogleAuthService) {}

  async ngOnInit() {
    this.jobComponent.planSelected.subscribe(async plan => {
      // Load the query plan into the display components.
      this.visComponent.loadPlan(plan);
      this.timingComponent.loadPlan(plan);

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
      }
    })
  }
}
