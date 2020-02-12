
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
 * Class to encapsulate test payload to send to server
 */
export class TestPayload {
  /**
   * Create a TestPayload instance
   * @param {object} name - The name of the test
   */
  constructor(name) {
    this.name = name;
    this.reqId = TestPayload.newRequestId();
    this.tSent = performance.now();
  }

  /**
   * Create a new request id.
   * @return {number} A random number
   */
  static newRequestId() {
    return Math.floor(Math.random() * Math.floor(1000000000000));
  }
}
