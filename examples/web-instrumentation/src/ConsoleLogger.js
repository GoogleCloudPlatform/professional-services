
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
 * @fileoverview Accepts log messages from the browser and outputs to the
 * (server) console.
 */

/**
 * @class
 * @classdesc A collection utility for logs. It is assumed that the logs will
 * be collected from the output and sent to log storage by a serverless
 * framework, such as Cloud Run, or that the user is running in a development
 * environment and wants to see the messages on the console.
 */
module.exports = class ConsoleLogger {
  /**
   * Creates a LogSink instance
   */
  constructor() {
    console.log('Logger.constructor');
  }

  /**
   * Write the messages to the console.
   * @param {string[]} messages - log messages
   * @return {number} The number of messages written
   */
  static sync(messages) {
    let num = 0;
    messages.forEach((msg) => {
      console.log(msg);
      num += 1;
    });
    return num;
  }
};
