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

package com.google.cloud.load

case class GRecvLoadTestConfig(targetHost: String = "0.0.0.0",
                               targetPort: Int = 51771,
                               copybookPath: String = "",
                               sqlPath: String = "",
                               importFilePath: String = "",
                               bucket: String = "",
                               projectId: String = "",
                               location: String = "",
                               numberOfRequests: Int = 1,
                               exportRunMode: String = "storage_api",
                               keepAliveTimeInSeconds: Int = 480,
                               timeoutMinutes: Int = 30,
                               numberThreads: Int = 4,
                               testCase: String = "export",
                               useSsl: Boolean = false,
                               bqSchemaPath: String = "")

