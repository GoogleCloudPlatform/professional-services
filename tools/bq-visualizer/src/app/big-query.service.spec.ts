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
import {TestBed} from '@angular/core/testing';
import {OAuthModule, OAuthService, UrlHelperService} from 'angular-oauth2-oidc';
import {of} from 'rxjs';
import {take} from 'rxjs/operators';

import {environment} from '../environments/environment';

import {BigQueryService} from './big-query.service';
import {BqJob} from './bq_job';
import {MockOAuthService} from './google-auth.service';
import {BqProject, Job} from './rest_interfaces';

describe('BigQueryService', () => {
  let service: BigQueryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, OAuthModule.forRoot()],
      providers: [
        BigQueryService,
        {provide: OAuthService, useClass: MockOAuthService},
        UrlHelperService,
      ]
    });

    service = TestBed.get(BigQueryService);
    httpMock = TestBed.get(HttpTestingController);
  });

  it('should get a single page of jobs', () => {
    const project = 'stephanmeyn-train-cbp';
    const jobId = 'bquxjob_7397faf7_1679db86d97';
    const jobs: BqJob[] = [];
    service.getJobs(`${project}.${jobId}`, 10).pipe(take(10)).subscribe(job => {
      jobs.push(job);
    }, console.error);

    const mockReq = httpMock.expectOne(
        `${environment.bqUrl}/${project}.${jobId}/jobs?` +
        `access_token=fake-oauth-token&maxResults=200&allUsers=true&projection=full`);
    expect(mockReq.cancelled).toBeFalsy();
    expect(mockReq.request.responseType).toEqual('json');
    mockReq.flush(require('../assets/test/get_jobs.json'));
    httpMock.verify();
    expect(jobs.length).toEqual(10);

    expect(jobs[0].jobId).toEqual(jobId);
    const tz = 'GMT+1100 (Australian Eastern Daylight Time)';
    expect(jobs[0].startTime.toString())
        .toEqual(`Wed Dec 12 2018 01:45:01 ${tz}`);
    expect(jobs[0].endTime.toString())
        .toEqual(`Wed Dec 12 2018 01:45:06 ${tz}`);
    expect(jobs[0].location).toEqual('EU');
    expect(jobs[0].projectId).toEqual(project);
    expect(jobs[0].kind).toEqual('bigquery#job');
    expect(jobs[0].id).toEqual(`${project}:EU.${jobId}`);
    expect(jobs[0].state).toEqual('DONE');
  });

  it('should get a single job', () => {
    let job: Job;
    service.getQueryPlan('projectid.foobar', 'abc1234', 'somelocation')
        .subscribe(res => {
          job = res;
        }, console.error);

    const mockReq = httpMock.expectOne(
        environment.bqUrl +
        '/projectid.foobar/jobs/abc1234?access_token=fake-oauth-token&location=somelocation');
    expect(mockReq.cancelled).toBeFalsy();
    expect(mockReq.request.responseType).toEqual('json');
    mockReq.flush(require('../assets/test/small_query_plan.json'));
    httpMock.verify();

    expect(job.id).toEqual(
        'stephanmeyn-playground:US.bquxjob_5b806654_1644a71f31e');
    expect(job.statistics.startTime).toEqual('1530263024864');
    expect(job.statistics.endTime).toEqual('1530263027522');
    expect(job.kind).toEqual('bigquery#job');
  });

  it('should get projects', () => {
    const projects: BqProject[] = [];
    service.getProjects().subscribe(project => {
      projects.push(project);
    }, console.error);

    const mockReq = httpMock.expectOne(
        environment.bqUrl + '?access_token=fake-oauth-token&maxResults=1000');
    expect(mockReq.cancelled).toBeFalsy();
    expect(mockReq.request.responseType).toEqual('json');
    mockReq.flush(require('../assets/test/get_projects.json'));
    httpMock.verify();

    expect(projects.length).toEqual(5);
  });

  it('should get multiple pages of jobs', done => {
    spyOn((service as any).http, 'get').and.callFake(url => {
      if (/pageToken=2/.test(url)) {
        return of(require('../assets/test/get_jobs_page_2.json'));
      }
      if (/pageToken=3/.test(url)) {
        return of(require('../assets/test/get_jobs_page_3.json'));
      }
      return of(require('../assets/test/get_jobs_page_1.json'));
    });

    const jobs: BqJob[] = [];
    service.getJobs('stephanmeyn-train-cbp.bquxjob_7397faf7_1679db86d97', 50)
        .subscribe(
            job => {
              jobs.push(job);
            },
            console.error,
            () => {
              expect(jobs.length).toEqual(50);
              done();
            });
  });
});
