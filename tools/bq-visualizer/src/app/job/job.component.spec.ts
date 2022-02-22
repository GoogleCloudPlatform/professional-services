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
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {DebugElement} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatCardModule} from '@angular/material/card';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';
import {By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {OAuthModule, OAuthService, UrlHelperService,} from 'angular-oauth2-oidc';
import {from, Observable} from 'rxjs';

import {BigQueryService, MockBigQueryService} from '../big-query.service';
import {BqJob} from '../bq_job';
import {MockOAuthService} from '../google-auth.service';
import {ProjectsComponent} from '../projects/projects.component';

import {JobComponent} from './job.component';

describe('JobComponent', () => {
  let component: JobComponent;
  let fixture: ComponentFixture<JobComponent>;
  const input = require('../../assets/test/get_jobs.json');
  const jobs = input.jobs.map(el => new BqJob(el));
  let de: DebugElement;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            OAuthModule.forRoot(),
            HttpClientTestingModule,
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
            FormsModule,
            RouterTestingModule,
            BrowserAnimationsModule,
          ],
          providers: [
            {provide: OAuthService, useClass: MockOAuthService},
            {provide: BigQueryService, useClass: MockBigQueryService},
            UrlHelperService,
          ],
          declarations: [
            JobComponent,
            ProjectsComponent,
          ]
        })
        .compileComponents();

    fixture = TestBed.createComponent(JobComponent);
    component = fixture.componentInstance;
    component.jobs = jobs;
    component.updatePaginatedJobs(5, 1)
    fixture.detectChanges();
    de = fixture.debugElement;
  }));

  it('should paginate jobs', () => {
    // Page 1.
    component.updatePaginatedJobs(2, 0)
    expect(component.paginatedJobs.length).toEqual(2);
    expect(component.paginatedJobs[0].id).toEqual(jobs[0].id);
    expect(component.paginatedJobs[1].id).toEqual(jobs[1].id);

    // Page 2.
    component.updatePaginatedJobs(2, 1)
    expect(component.paginatedJobs.length).toEqual(2);
    expect(component.paginatedJobs[0].id).toEqual(jobs[2].id);
    expect(component.paginatedJobs[1].id).toEqual(jobs[3].id);
  });

  it('should render the paginator', () => {
    const paginator = de.query(By.css('mat-paginator')).nativeElement;
    expect(paginator.attributes['ng-reflect-length'].textContent)
        .toEqual(jobs.length.toString());
    expect(paginator.attributes['ng-reflect-page-size'].textContent)
        .toEqual(component.pageSize.toString());
  });

  it('should get new jobs from bqService and paginate them', () => {
    // Select a dummy project in the ProjectsComponent instance.
    const pc = de.query(By.directive(ProjectsComponent)).componentInstance;
    pc.selectedProject = {
      kind: 'project',
      id: 'project',
      numericId: 1,
      projectReference: undefined,
      friendlyName: 'project',
    };

    // Click the "Get Jobs" button.
    de.query(By.css('app-projects button#btnListJobs'))
        .triggerEventHandler('click', null);

    fixture.whenStable().then(() => {
      // The output jobs list should be correctly paginated.
      expect(component.paginatedJobs.length).toEqual(component.pageSize);
    });
  });
});
