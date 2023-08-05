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
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';

import {BqQueryPlan} from './bq_query_plan';
import {LogService} from './log.service';


/**
 * Manages the instance of BQJob that needs to be rendered by components.
 * Also provides an upload service of BQJob json files via a file reader.
 */
@Injectable({providedIn: 'root'})
export class QueryPlanService {
  constructor(private logSvc: LogService) {}

  /** Upload a file from local system. */
  upload(file: File): Promise<BqQueryPlan> {
    return new Promise((resolve, reject) => {
      this.logSvc.debug('upload start');
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onloadend = e => {
        try {
          const plan =
              new BqQueryPlan(JSON.parse(reader.result as string), this.logSvc);
          this.logSvc.debug('QueryPlan loaded from uploaded file');
          resolve(plan);
        } catch (e:any) {
          this.logSvc.error(e);
          alert(e);
          reject(e);
        }
      };
    });
  }
}
