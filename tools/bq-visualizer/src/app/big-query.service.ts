import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {OAuthService} from 'angular-oauth2-oidc';
import {concat, defer, EMPTY, from, Observable, of, Subscription} from 'rxjs';
import {catchError, filter, map} from 'rxjs/operators';

import {environment} from '../environments/environment';

import {BqJob} from './bq_job';
import {LogService} from './log.service';
import {BqListJobResponse, BqProject, BqProjectListResponse, Job} from './rest_interfaces';

export type GetJobsReturn = [Observable<BqJob>, () => any];

/** All services that talk to the BigQuery API. */
@Injectable({providedIn: 'root'})
export class BigQueryService {
  projectList: BqProject[] = [];
  projectFilter: string;
  lastProjectId: string;

  constructor(
      private http: HttpClient, private oauthService: OAuthService,
      private logSvc: LogService) {}

  /** Get the detail of a job. */
  getQueryPlan(projectId: string, jobId: string): Observable<Job> {
    // Extract job id if the job id is a collection of
    // [project]:[location].jobId
    const realid = jobId.split('.').slice(-1)[0];
    this.logSvc.debug(`getQueryPlan: fetched query plan for jobid=${jobId}`);

    const token = this.oauthService.getAccessToken();
    const url = bqUrl(`/${projectId}/jobs/${realid}`, {access_token: token});
    this.logSvc.debug(`Requested job detail for: ${realid}`);
    return this.http.get<Job>(url).pipe(
        catchError(this.handleError('getQueryPlan')));
  }

  /** Get all jobs for a project. */
  getJobs(projectId: string): Observable<BqJob> {
    return Observable.create(async obs => {
      const token = this.oauthService.getAccessToken();
      let nextPageToken = '';
      while (true) {
        const url = bqUrl(`/${projectId}/jobs`, {
          access_token: token,
          maxResults: 200,
          projection: 'full',
          pageToken: nextPageToken,
        });

        try {
          await new Promise((resolve, reject) => {
            this.http.get<BqListJobResponse>(url).subscribe(
                res => {
                  if (!res.jobs) {
                    console.error(`No jobs found in bq response`, res);
                    alert(
                        `There were no jobs found that you can view. You ` +
                        `need the Owner permission on the project to view ` +
                        `other's jobs`);
                    throw new Error('No jobs found');
                  }
                  for (const job of res.jobs.map(el => new BqJob(el))) {
                    if (obs.closed) return;
                    obs.next(job);
                  }
                  nextPageToken = res.nextPageToken;
                },
                err => {
                  console.error(`Error loading jobs: ${err}`);
                  throw new Error(err);
                },
                () => {
                  resolve();
                });
          });
        } catch (err) {
          obs.error(err);
        }

        if (!nextPageToken || obs.closed) {
          obs.complete();
          return;
        }
      }
    });
  }

  /** Get all projects. */
  getProjects(): Observable<BqProject> {
    return Observable.create(async obs => {
      const token = this.oauthService.getAccessToken();
      let nextPageToken = '';
      while (true) {
        const url = bqUrl('', {
          access_token: token,
          maxResults: 1000,
          pageToken: nextPageToken,
        });

        try {
          await new Promise((resolve, reject) => {
            this.http.get<BqProjectListResponse>(url).subscribe(
                res => {
                  if (!res.projects) {
                    throw new Error('No projects found');
                  }
                  for (const project of res.projects) {
                    if (obs.closed) return;
                    obs.next(project);
                  }
                  nextPageToken = res.nextPageToken;
                },
                err => {
                  console.error(`Error loading projects: ${err}`);
                  throw (err);
                },
                () => {
                  resolve();
                });
          });
        } catch (err) {
          obs.error(err);
        }

        if (!nextPageToken || obs.closed) {
          obs.complete();
          return;
        }
      }
    });
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   */
  private handleError(operation = 'operation'): any {
    return (error: any): Observable<any> => {
      this.logSvc.error(`${operation} failed: ${error.message}`);
      if (error.error.error.message) {
        this.logSvc.error(
            `${operation} failed(2): ${error.error.error.message}`);
        alert(`${operation} failed: ${error.error.error.message}`);
      }
      return of([]);
    };
  }
}

function bqUrl(path: string, args: any): string {
  let url = environment.bqUrl + path;
  if (args) {
    let opts = [];
    for (const key of Object.keys(args)) {
      if (args[key]) {
        opts.push(
            encodeURIComponent(key) + '=' + encodeURIComponent(args[key]));
      }
    }
    url += '?' + opts.join('&');
  }
  return url;
}

@Injectable({providedIn: 'root'})
export class MockBigQueryService extends BigQueryService {
  getJobs(projectId: string): Observable<BqJob> {
    return from(require('../assets/test/get_jobs.json').jobs);
  }

  getProjects(): Observable<BqProject> {
    return from(require('../assets/test/get_projects.json').projects);
  }
}
