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

case class DataflowFlexTemplateRunConfig(jobName: String = "",
                                         projectId: String = "",
                                         templateFileGcsLocation: String = "",
                                         stagingLocation: String = "",
                                         tempLocation: String = "",
                                         region: String = "us-central1",
                                         workerRegion: String = "",
                                         workerZone: String = "",
                                         workerMachineType: String = "",
                                         network: String = "",
                                         subnetwork: String = "",
                                         serviceAccount: String = "",
                                         kmsKey: String = "",
                                         numWorkers: Int = 1,
                                         maxWorkers: Int = 1,
                                         parameters: Map[String,String] = Map.empty,
                                         labels: Map[String,String] = Map.empty,
                                         experiments: Seq[String] = Nil)
