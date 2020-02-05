'use strict';
// Copyright 2019 Google LLC
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

import {fromEvent} from 'rxjs';
import {LoadTest} from './LoadTest';
import {TestSummary} from './TestSummary';

/**
 * Class encapsulating the test application.
 */
export class TestApp {
  /**
   * Create a TestApp instance
   * @param {string} agentURL - The URL of the OpenCensus agent
   */
  constructor(agentURL) {
    const testSummary = new TestSummary();
    // Handle events for the name form
    const testForm = document.getElementById('testForm');
    const nameTF = document.getElementById('nameTF');
    const numIterTF = document.getElementById('numIterTF');
    const delayTF = document.getElementById('delayTF');
    if (testForm) {
      const events = fromEvent(testForm, 'submit');
      events.subscribe( (event) => {
        event.preventDefault();
        const name = nameTF.value;
        const iterations = Number(numIterTF.value);
        const delay = Number(delayTF.value);
        const test = new LoadTest(name, iterations, delay, agentURL);
        const observable = test.runTest();
        testSummary.display(name, iterations, observable);
        return false;
      });
    }
  }
}
