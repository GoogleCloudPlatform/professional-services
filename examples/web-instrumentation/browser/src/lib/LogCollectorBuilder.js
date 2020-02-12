
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

import { LogCollector } from './LogCollector';

/**
 * Class to configure creation of a LogCollector objects.
 */
export class LogCollectorBuilder {
  /**
   * Use LogCollectorBuilder to creates a LogCollector object
   * @param {string} buildId - identifying the app build
   */
  constructor(buildId) {
    this.buildId = buildId;
  }

  /**
   * Creates a new LogCollector with the given or default configuration
   * @return The LogCollector instance created
   * @return {LogCollector} The LogCollector created
   */
  makeLogCollector() {
    return new LogCollector(this.buildId);
  }

  /**
   * @return {string} the buildId to be prepended to log messages
   */
  getBuildId() {
    return this.buildId;
  }

  /**
   * Use the build id to identify logs from particular app versions
   * @param {string} buildId - Prepended to the logs to identify the version
   * @return {LogCollectorBuilder} For chaining of calls
   */
  setBuildId(buildId) {
    this.buildId = buildId;
    return this;
  }
}
