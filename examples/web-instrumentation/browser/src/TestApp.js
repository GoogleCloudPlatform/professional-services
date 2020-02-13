
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

import { fromEvent } from 'rxjs';
import { LoadTest } from './LoadTest';
import { TestSummary } from './TestSummary';

/**
 * Class encapsulating the test application.
 */
export class TestApp {
  /**
   * Create a TestApp instance
   * @param {string} collectorURL - The URL of the OpenCensus agent
   * @param {string} buildId - Identifies the build
   */
  constructor(collectorURL, buildId) {
    this.collectorURL = collectorURL;
    this.buildId = buildId;
  }

  /**
   * Display the test form ready for the user to run
   */
  setup() {
    // Handle events for the name form
    const testForm = document.getElementById('testForm');
    const nameTF = document.getElementById('nameTF');
    const numIterTF = document.getElementById('numIterTF');
    const delayTF = document.getElementById('delayTF');
    if (testForm) {
      const events = fromEvent(testForm, 'submit');
      events.subscribe((event) => {
        event.preventDefault();
        const name = nameTF.value;
        const iterations = Number(numIterTF.value);
        const delay = Number(delayTF.value);
        const test = new LoadTest(name,
          iterations,
          delay,
          this.collectorURL,
          this.buildId);
        const observable = test.runTest();
        TestSummary.display(name, iterations, observable);
        return false;
      });
    }
  }
}
