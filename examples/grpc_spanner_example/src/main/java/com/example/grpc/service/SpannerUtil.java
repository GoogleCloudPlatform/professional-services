/**
 * Copyright 2022 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.example.grpc.service;

import com.google.cloud.spanner.v1.SpannerClient;
import com.google.spanner.v1.CreateSessionRequest;
import com.google.spanner.v1.DatabaseName;
import com.google.spanner.v1.Session;

/*
 Manages spanner initializations and accesses.
*/
public class SpannerUtil {

  /*
   Initializes a {@link Session}.
  */
  public static Session createSession(SpannerClient spannerClient) {
    CreateSessionRequest request =
        CreateSessionRequest.newBuilder().setDatabase(getDatabaseName().toString()).build();
    return spannerClient.createSession(request);
  }

  /*
   * Configures a project, instance and a database to connect in Spanner.
   * Substitute <my_project_id> with the id of your Google project.
   */
  public static DatabaseName getDatabaseName() {
    return DatabaseName.of("<my_project_id>", "grpc-example", "grpc_example_db");
  }
}
