
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

/**
 * Class to present a summary view of the current test.
 */
export class TestSummary {
  /**
   * Displays test results in the DOM
   * @param {string} name - The name of the test
   * @param {number} iterations - The number of iterations
   * @param {Observable} observable - To subscribe to for updates
   * @return {Observable} The observable subscribed to
   */
  static display(name, iterations, observable) {
    const summaryDiv = document.getElementById('summaryDiv');
    const testStatusP = document.getElementById('testStatusP');
    const testNameP = document.getElementById('testNameP');
    const numIterP = document.getElementById('numIterP');
    const numSentP = document.getElementById('numSentP');
    const numSuccessP = document.getElementById('numSuccessP');
    const numFailP = document.getElementById('numFailP');
    if (summaryDiv) {
      console.log(`Running test: ${name} with ${iterations} iterations`);
      if (testNameP) {
        testNameP.textContent = `Test name: ${name}`;
      }
      if (testStatusP) {
        testStatusP.textContent = 'Test status: started';
      }
      if (numIterP) {
        numIterP.textContent = `Target iterations: ${iterations}`;
      }
      summaryDiv.style.display = 'block';
    }
    return observable.subscribe({
      next(results) {
        console.log(`TestSummary: numSent ${results.numSent}`);
        if (testStatusP) {
          testStatusP.textContent = 'Test status: running';
        }
        if (numSentP) {
          numSentP.textContent = `Number sent: ${results.numSent}`;
        }
        if (numSuccessP) {
          numSuccessP.textContent = `Number success: ${results.numSuccess}`;
        } else {
          console.log(`TestSummary: number success: ${results.numSuccess}`);
        }
        if (numFailP) {
          numFailP.textContent = `Number fail: ${results.numFail}`;
        } else {
          console.log(`TestSummary: number fail: ${results.numFail}`);
        }
      },
      error(err) {
        console.error(`TestSummary: something wrong occurred: ${err}`);
      },
      complete() {
        console.log('TestSummary: done');
        if (testStatusP) {
          testStatusP.textContent = 'Test status: done';
        }
      },
    });
  }
}
