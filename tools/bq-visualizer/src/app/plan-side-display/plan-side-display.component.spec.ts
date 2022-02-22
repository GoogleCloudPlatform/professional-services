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
import {DebugElement} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonModule, MatCheckboxModule, MatGridListModule, MatIconModule, MatMenuModule} from '@angular/material';
import {MatCardModule} from '@angular/material/card';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {By} from '@angular/platform-browser';

import {StageDetailsComponent} from '../stage-details/stage-details.component';
import {StepDetailsComponent} from '../step-details/step-details.component';

import {PlanSideDisplayComponent} from './plan-side-display.component';

describe('PlanSideDisplayComponent', () => {
  let component: PlanSideDisplayComponent;
  let fixture: ComponentFixture<PlanSideDisplayComponent>;
  let de: DebugElement;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          declarations: [
            PlanSideDisplayComponent,
            StageDetailsComponent,
            StepDetailsComponent,
          ],
          imports: [
            MatTabsModule,
            MatGridListModule,
            MatFormFieldModule,
            MatButtonModule,
            MatCheckboxModule,
            MatSelectModule,
            MatCardModule,
            MatExpansionModule,
            MatInputModule,
            MatPaginatorModule,
            MatTableModule,
            MatGridListModule,
            MatMenuModule,
            MatIconModule,
          ],
        })
        .compileComponents();

    fixture = TestBed.createComponent(PlanSideDisplayComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;
  }));

  it('should render the containers', () => {
    fixture.detectChanges();
    const stage = de.query(By.css('app-stage-details')).nativeElement;
    expect(stage).toBeTruthy();
    const steps = de.query(By.css('app-step-details')).nativeElement;
    expect(steps).toBeTruthy();
  });

  it('should render text in the app-stage-details', () => {
    component.stageDetails = 'hello world';
    fixture.detectChanges();
    const pre = de.query(By.css('app-stage-details pre')).nativeElement;
    expect(pre.textContent).toEqual('hello world');
  });
});
