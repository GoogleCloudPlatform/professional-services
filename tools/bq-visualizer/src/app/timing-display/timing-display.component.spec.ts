import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MatButtonModule, MatCheckboxModule, MatGridListModule, MatIconModule, MatMenuModule} from '@angular/material';
import {MatCardModule} from '@angular/material/card';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';

import {PlanSideDisplayComponent} from '../plan-side-display/plan-side-display.component';
import {PlanStatusCardComponent} from '../plan-status-card/plan-status-card.component';
import {StageDetailsComponent} from '../stage-details/stage-details.component';
import {StepDetailsComponent} from '../step-details/step-details.component';

import {TimingDisplayComponent} from './timing-display.component';

describe('TimingDisplayComponent', () => {
  let component: TimingDisplayComponent;
  let fixture: ComponentFixture<TimingDisplayComponent>;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            MatButtonModule,
            MatCardModule,
            MatCheckboxModule,
            MatExpansionModule,
            MatFormFieldModule,
            MatGridListModule,
            MatIconModule,
            MatInputModule,
            MatMenuModule,
            MatPaginatorModule,
            MatSelectModule,
            MatTableModule,
            MatTabsModule,
            FormsModule,
            RouterTestingModule,
            BrowserAnimationsModule,
          ],
          providers: [],
          declarations: [
            PlanSideDisplayComponent,
            PlanStatusCardComponent,
            StageDetailsComponent,
            StepDetailsComponent,
            TimingDisplayComponent,
          ]
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimingDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /*
  // TODO(dparrish): This is currently broken, fix it!
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  */
});
