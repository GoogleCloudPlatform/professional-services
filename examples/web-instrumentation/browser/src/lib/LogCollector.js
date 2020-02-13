
// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { catchError, map } from 'rxjs/operators';

/**
 * Class to collect log and error messages into buffers which are sent to the
 * server at regular intervals. It will replace the console.log() and
 * console.error() methods, if configured to do so.
 */
export class LogCollector {
  /**
   * Use LogCollectorBuilder to creates a LogCollector object
   * @param {string} buildId - identifying the app build
   */
  constructor(buildId) {
    this.buildId = buildId;
    this.logs = [];
    this.errors = [];
    // Listen for global errors
    window.onerror = (msg, url, lineNo, columnNo, error) => {
      if (error && error.stack) {
        this.errors.push(`Uncaught error: ${msg} in url `
                         + `${url}\n${error.stack}`);
      } else {
        this.errors.push(`Uncaught error: ${msg}\n url ${url}\n Line: `
                         + `${lineNo}`);
      }
    };
  }

  /**
   * Log an error
   * @param {string} msg - The message to log
   * @param {Array.<Object>} args - Optional parameters
   */
  error(msg, ...args) {
    let message = msg;
    if (args) {
      message += args.join(', ');
    }
    this.errors.push(`browser app ${this.buildId} error:\n${message}`);
  }

  /**
   * Log a message
   * @param {string} msg - The message to log
   * @param {Array.<Object>} args - Optional parameters
   */
  log(msg, ...args) {
    let message = msg;
    if (args) {
      message += args.join(', ');
    }
    this.logs.push(`browser app ${this.buildId}: ${message}`);
  }

  /**
   * Flush the logs to the server at regular intervals
   * @param {integer} interval - The interval to flush the log in ms
   */
  start(interval = 10000) {
    console.log(`LogCollector: Starting replication: ${interval} ms intervals`);
    const flushLogs = () => {
      const statusDiv = document.getElementById('logStatus');
      if ((this.logs && this.logs.length) > 0
          || (this.errors && this.errors.length) > 0) {
        console.log(`Flushing ${this.logs.length} logs`);
        if (statusDiv) {
          statusDiv.textContent = 'Status: flushing logs';
        }
        const payload = { logs: this.logs, errors: this.errors };
        const obs = ajax({
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          url: '/log',
        }).pipe(
          map(() => {
            if (statusDiv) {
              const lNum = this.logs.length;
              const eNum = this.errors.length;
              const message = `Status: flushed ${lNum} logs and `
                                + `${eNum} errors`;
              statusDiv.textContent = message;
            }
          }),
          catchError((error) => {
            console.error('error: ', error);
            if (statusDiv) {
              statusDiv.textContent = `Status: error flushing logs: ${error}`;
            }
            return of(error);
          }),
        );
        obs.subscribe(
          () => {
            this.logs = [];
            this.errors = [];
          },
          (err) => console.error(`Flush error ${err}`),
        );
      } else if (statusDiv) {
        statusDiv.textContent = 'Status: no logs or errors to flush';
      }
    };
    setInterval(flushLogs, interval);
  }
}
