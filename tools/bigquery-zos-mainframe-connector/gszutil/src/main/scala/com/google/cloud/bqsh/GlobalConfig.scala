/*
 * Copyright 2022 Google LLC All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.bqsh

object GlobalConfig {
  val datasetIdText = """The default dataset to use for requests. This flag is ignored when not applicable. You can set the value to [PROJECT_ID]:[DATASET] or [DATASET]. If [PROJECT_ID] is missing, the default project is used. You can override this setting by specifying the --project_id flag. The default value is ''."""
  val debugModeText = """Set logging level to debug. The default value is false."""
  val jobIdText = """The unique job ID to use for the request. If not specified in a job creation request, a job ID is generated. This flag applies only to commands that create jobs: cp, extract, load, and query."""
  val locationText = """A string corresponding to your region or multi-region location."""
  val projectIdText = """The project ID to use for requests. The default value is ''."""
  val synchronousModeText = """If set to true, wait for the command to complete before returning, and use the job completion status as the error code. If set to false, the job is created, and successful completion status is used for the error code. The default value is true."""
  val syncText = """If set to true, wait for the command to complete before returning, and use the job completion status as the error code. If set to false, the job is created, and successful completion status is used for the error code. The default value is true."""
}
