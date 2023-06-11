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
/** the detail of a BQ Job as retrieved from the JOBS REST API */
import {Job} from './rest_interfaces';

export class BqJob {
  kind: string;
  id: string;
  state: string;
  statementType: string;
  projectId: string;
  startTime: Date;
  endTime: Date;
  jobId: string;
  location: string;
  shortenedJobId: string;

  constructor(data: Job) {
    this.kind = data.kind;
    this.id = data.id;
    if (data.errorResult) {
      this.state = 'ERROR';
    } else {
      this.state = data.state;
    }
    this.startTime = this.dateFromTimeString(data.statistics.startTime);
    this.endTime = this.dateFromTimeString(data.statistics.endTime);
    this.projectId = data.jobReference? data.jobReference.projectId: '';
    this.jobId = data.jobReference? data.jobReference.jobId: '';
    this.location = data.jobReference? data.jobReference.location: '';
    if (data.configuration && data.configuration.query) {
      this.shortenedJobId = data.configuration.query.query;
    } else {
      this.shortenedJobId = data.jobReference? data.jobReference.jobId: '';
    }
  }

  private dateFromTimeString(timeString: String): Date {
    const aNumber = Number(timeString);
    if (isNaN(aNumber)) {
      //console.log('can\'t parse timeString :' + timeString);
      return undefined;
    }
    return new Date(aNumber);
  }
}
