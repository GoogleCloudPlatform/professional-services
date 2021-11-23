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
import {OAuthModule, OAuthService, UrlHelperService} from 'angular-oauth2-oidc';

import {BigQueryService, MockBigQueryService} from '../big-query.service';
import {MockOAuthService} from '../google-auth.service';
import {BqProjectListResponse} from '../rest_interfaces';

import {ProjectsComponent} from './projects.component';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;
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
            BrowserAnimationsModule,
          ],
          providers: [
            {provide: OAuthService, useClass: MockOAuthService},
            {provide: BigQueryService, useClass: MockBigQueryService},
            UrlHelperService,
          ],
          declarations: [ProjectsComponent]
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    de = fixture.debugElement;
  });

  it('should fetch projects', () => {
    const projects = require('../../assets/test/get_projects.json');

    de.query(By.css('button#btnGetProjects'))
        .triggerEventHandler('click', null);

    // The component should have the internal projects list updated and sorted.
    fixture.detectChanges();
    expect(component.projects.length).toEqual(5);
    expect(component.allProjects.length).toEqual(5);
    expect(component.selectedProject.id).toEqual('gke-chiachenk-hosted-master');

    // The first option in the select list should be selected.
    const options = de.query(By.css('mat-select')).componentInstance.options;
    expect(options.length).toEqual(component.projects.length);
    expect(options.first.value).toEqual(component.selectedProject);
  });
});
