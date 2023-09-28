/*
 * Copyright 2021 Google LLC
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
import {Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {PageEvent} from '@angular/material/paginator';
import {MatPaginator} from '@angular/material/paginator';
import {Router} from '@angular/router';
import {Observable, of} from 'rxjs';
import {Subject, Subscription} from 'rxjs';
import {catchError, publishReplay, refCount, take, takeUntil} from 'rxjs/operators';

import {BigQueryService} from '../big-query.service';
import {BqJob} from '../bq_job';
import {BqQueryPlan} from '../bq_query_plan';
import {LogService} from '../log.service';
import {ProjectsComponent} from '../projects/projects.component';
import {QueryPlanService} from '../query-plan.service';
import {BqListJobResponse, BqProject, BqProjectListResponse, GetJobsRequest, Job, Project} from '../rest_interfaces';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.css']
})
export class JobComponent implements OnDestroy {
  jobs: BqJob[];
  paginatedJobs: BqJob[] = [];
  selectedProject: BqProject;
  planFile: File;
  jobId: string;
  readonly displayedColumns = ['btn', 'timestamp', 'id', 'state'];
  readonly pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 100];
  pageEvent: PageEvent;  // from paginator
  private readonly destroy = new Subject<void>();

  // Emitted events.
  @Output() planSelected = new EventEmitter<BqQueryPlan>();

  constructor(
      private planService: QueryPlanService, private logSvc: LogService,
      private router: Router, private bqService: BigQueryService) {}

  ngOnDestroy() {
    this.destroy.next();
  }

  openInput() {
    // You can use ElementRef for this later.
    document.getElementById('fileInput').click();
  }

  fileChange(files: File[]) {
    if (files === null){
      return;
    }

    if (files.length > 0) {
      this.planFile = files[0];
      this.logSvc.debug(' file changed: ' + this.planFile);
      const fnameDiv = document.getElementById('filenamedisp');
      fnameDiv.textContent = this.planFile.name;
    }
  }

  async upload() {
    this.logSvc.debug(' uploading...');
    const plan = await this.planService.upload(this.planFile);
    this.logSvc.debug(' uploading. complete');
    this.planSelected.emit(plan);
  }

  /**
   * Event handler called when the 'list jobs' button in the Project component
   * is clicked.
   */
  getJobs(request: GetJobsRequest) {
    this.jobs = [];
    this.selectedProject = request.project;
    this.bqService.getJobs(request.project.id, request.limit, request.allUsers)
        .pipe(takeUntil(this.destroy))
        .subscribe(
            res => {
              // this.logSvc.debug('job received from Bq Api');
              this.jobs.push(res);
            },
            err => {
              this.logSvc.error(err);
              if (err && err.message) {
                alert(err.message);
              }
              console.log(err);
              this.logSvc.error(' error on getJobs: ' + err);
            },
            () => {
              this.updatePaginatedJobs(
                  this.pageSize, this.pageEvent ? this.pageEvent.pageIndex : 0);
            });
  } /** when a Job is requested by job id */
  loadJob(): void {
    // job id is of format: <projectname>:<location>.<id>
    const regex = new RegExp('(?<project>.+):(?<location>.+)\\.(?<id>.+)');

    const parsed: any =
        regex.exec(this.jobId.trim());  // Property 'groups' does not exist on
                                        // type 'RegExpExecArray'
    if (parsed) {
      this.bqService
          .getQueryPlan(
              parsed.groups['project'], parsed.groups['id'],
              parsed.groups['location'])
          .pipe(takeUntil(this.destroy))
          .subscribe(
              detail => {
                if (detail) {
                  const plan = new BqQueryPlan(detail, this.logSvc);
                  if (plan.isValid) {
                    this.planSelected.emit(plan);
                  } else {
                    this.planSelected.emit(null);
                  }
                }
              },
              err => {
                this.logSvc.error(err);
              });
    }
  }
  // -------------  interacting with the Jobs grid ------------

  /** When selecting an item in the drop down list. */
  selectJob(job: BqJob): void {
    this.bqService.getQueryPlan(job.projectId, job.id, job.location)
        .pipe(takeUntil(this.destroy))
        .subscribe(
            detail => {
              if (detail) {
                const plan = new BqQueryPlan(detail, this.logSvc);
                if (plan.isValid) {
                  this.planSelected.emit(plan);
                } else {
                  this.planSelected.emit(null);
                }
              }
            },
            err => {
              this.logSvc.error(err);
            });
  }

  switchPage(event: PageEvent) {
    this.pageEvent = event;
    this.updatePaginatedJobs(event.pageSize, event.pageIndex);
  }

  updatePaginatedJobs(pageSize: number, pageIndex: number): void {
    this.paginatedJobs =
        this.jobs.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  }
}
