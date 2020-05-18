/*
 *  Copyright 2020 Google Inc. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.google.cloud.dataproc.auth
import com.google.api.client.http.{HttpRequestInitializer, HttpTransport}
import com.google.api.client.http.apache.v2.ApacheHttpTransport
import com.google.api.client.json.JsonFactory
import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.services.compute.Compute
import com.google.api.services.dataproc.Dataproc
import com.google.auth.http.HttpCredentialsAdapter
import com.google.auth.oauth2.GoogleCredentials

object Client {
  /**
   * Creates a client object
   */
  private lazy val credentials: GoogleCredentials = GoogleCredentials.getApplicationDefault
  private lazy val httpRequestInitializer: HttpRequestInitializer = new HttpCredentialsAdapter(credentials)
  private lazy val httpTransport: HttpTransport = new ApacheHttpTransport
  lazy val jsonFactory: JsonFactory = JacksonFactory.getDefaultInstance

  // Initialise global parameters via ```Compute.Builder``` and ```Dataproc.Builder```
  @transient lazy val compute: Compute =
    new Compute.Builder(httpTransport, jsonFactory, httpRequestInitializer)
      .setApplicationName("dataproc-init-auth").build
  @transient lazy val dataproc: Dataproc =
    new Dataproc.Builder(httpTransport, jsonFactory, httpRequestInitializer)
      .setApplicationName("dataproc-init-auth").build
}
