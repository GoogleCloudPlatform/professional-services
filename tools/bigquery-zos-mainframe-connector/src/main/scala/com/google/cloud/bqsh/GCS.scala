/*
 * Copyright 2019 Google LLC All Rights Reserved.
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

import com.google.api.gax.retrying.RetrySettings
import com.google.api.gax.rpc.FixedHeaderProvider
import com.google.auth.Credentials
import com.google.cloud.gszutil.CCATransportFactory
import com.google.cloud.http.HttpTransportOptions
import com.google.cloud.storage.{Storage, StorageOptions}
import org.threeten.bp.Duration

object GCS {
  def defaultClient(credentials: Credentials): Storage = {
    StorageOptions.newBuilder
      .setCredentials(credentials)
      .setTransportOptions(HttpTransportOptions.newBuilder
        .setHttpTransportFactory(new CCATransportFactory)
        .build)
      .setRetrySettings(RetrySettings.newBuilder
        .setMaxAttempts(100)
        .setTotalTimeout(Duration.ofMinutes(30))
        .setInitialRetryDelay(Duration.ofSeconds(2))
        .setMaxRetryDelay(Duration.ofSeconds(30))
        .setRetryDelayMultiplier(2.0d)
        .build)
      .setHeaderProvider(FixedHeaderProvider.create("user-agent", Bqsh.UserAgent))
      .build
      .getService
  }
}
