
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

import { Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { CollectorExporter } from '@opentelemetry/exporter-collector';
import { BatchSpanProcessor } from '@opentelemetry/tracing';
import { XMLHttpRequestPlugin } from '@opentelemetry/plugin-xml-http-request';
import { ZoneScopeManager } from '@opentelemetry/scope-zone';
import { WebTracerProvider } from '@opentelemetry/web';
import { TestResults } from './TestResults';
import { TestPayload } from './TestPayload';
import { LogCollectorBuilder } from './lib/LogCollectorBuilder';

/**
 * Class to run a load test and track reuqests.
 */
export class LoadTest {
  /**
   * Create a LoadTest
   * @param {string} name - The name of the test
   * @param {number} targetIter - The target number of iterations
   * @param {number} delay - Time between requests
   * @param {string} collectorURL - The URL of the OpenCensus agent
   * @param {string} buildId - Identifies the build
   */
  constructor(name, targetIter, delay, collectorURL, buildId) {
    this.name = name;
    this.targetIter = targetIter;
    this.delay = delay;
    this.numSent = 0;
    this.numSuccess = 0;
    this.numFail = 0;
    const builder = new LogCollectorBuilder().setBuildId(buildId);
    this.logCollector = builder.makeLogCollector();
    // Ship logs to the server every five seconds
    this.logCollector.start(5000);
    const webTracerWithZone = new WebTracerProvider({
      scopeManager: new ZoneScopeManager(),
      plugins: [
        new XMLHttpRequestPlugin({
          ignoreUrls: ['/log', '/trace'],
        }),
      ],
    });
    const collectorOptions = {
      url: collectorURL,
    };
    const exporter = new CollectorExporter(collectorOptions);
    webTracerWithZone.addSpanProcessor(new BatchSpanProcessor(exporter));
  }

  /**
   * Send data to the server
   * @param {object} data - The data to send
   * @param {number} iterations - The number of iterations
   * @param {number} interval - Time between each request
   * @return {Observable} to subscribe to results of the test
   */
  runTest() {
    let runDelay = 0.0;
    for (let i = 0; i < this.targetIter; i += 1) {
      runDelay += this.delay;
      setTimeout(() => {
        const data = new TestPayload(this.name);
        this.sendData(data);
      }, runDelay);
    }
    return new Observable((subscriber) => {
      setInterval(() => {
        const results = this.getResults();
        subscriber.next(results);
        const numRecieved = this.numSuccess + this.numFail;
        if (numRecieved === this.targetIter) {
          subscriber.complete();
        }
      }, 1000);
    });
  }

  /**
   * Returns the test results
   * @return {TestResults} test results
   */
  getResults() {
    return new TestResults(
      this.numSent,
      this.numSuccess,
      this.numFail,
    );
  }

  /**
   * Send data to the server
   * @param {object} payload - The data to send
   */
  sendData(payload) {
    const data = {
      name: payload.name,
      reqId: payload.reqId,
      tSent: payload.tSent,
    };
    this.numSent += 1;
    const urlStr = `/data/${payload.reqId}`;
    const obs = ajax({
      body: JSON.stringify({ data }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      url: urlStr,
    });
    obs.subscribe(
      (val) => {
        const resp = val.response;
        this.numSuccess += 1;
        if (this.numSuccess % 100 === 0) {
          this.logCollector.log(`Num success: ${this.numSuccess}`);
        }
        if (resp instanceof Object && 'tSent' in resp && 'name' in resp
            && 'reqId' in resp) {
          const latency = performance.now() - resp.tSent;
          this.logCollector.log(`LoadTest: latency: ${latency}, `
                                  + `${resp.name}, reqId: ${resp.reqId}`);
        } else {
          this.logCollector.log('LoadTest: Payload does not include '
                                   + 'expected fields');
        }
      },
      (err) => {
        this.numFail += 1;
        this.logCollector.error(`Error sending data ${err}`);
        this.logCollector.log(`Num failures: ${this.numFail}`);
      },
    );
  }
}
