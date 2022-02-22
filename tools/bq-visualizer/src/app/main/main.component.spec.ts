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
import {Component} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MatCardModule, MatFormFieldModule, MatGridListModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSelectModule, MatTableModule, MatTabsModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {OAuthModule} from 'angular-oauth2-oidc';

import {JobComponent} from '../job/job.component';
import {LogDisplayComponent} from '../log-display/log-display.component';
import {PlanSideDisplayComponent} from '../plan-side-display/plan-side-display.component';
import {PlanStatusCardComponent} from '../plan-status-card/plan-status-card.component';
import {ProjectsComponent} from '../projects/projects.component';
import {StageDetailsComponent} from '../stage-details/stage-details.component';
import {StepDetailsComponent} from '../step-details/step-details.component';
import {TimingDisplayComponent} from '../timing-display/timing-display.component';
import {VisDisplayComponent} from '../vis-display/vis-display.component';

import {MainComponent} from './main.component';

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            MatTabsModule, MatGridListModule, MatCardModule, MatPaginatorModule,
            MatTableModule, MatIconModule, MatSelectModule, MatFormFieldModule,
            MatInputModule, MatSelectModule, FormsModule, BrowserModule,
            BrowserAnimationsModule
          ],
          declarations: [
            OAuthModule.forRoot(), MainComponent, JobComponent,
            VisDisplayComponent, TimingDisplayComponent, LogDisplayComponent,
            PlanStatusCardComponent, PlanStatusCardComponent,
            PlanSideDisplayComponent, ProjectsComponent, StageDetailsComponent,
            StepDetailsComponent
          ]
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
