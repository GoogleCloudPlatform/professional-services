/*
 * Copyright 2021 Google LLC
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
package com.google.cloud.pso.functions;

import com.google.auth.Credentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import java.io.File;
import java.io.FileInputStream;

/** Utils class to help with BigQuery interaction. */
public class Utils {
  private static final String AUTO_DETECT_PLACEHOLDER = "auto-detect";

  public static BigQuery createBigQueryClient(String keyPath) {
    BigQueryOptions.Builder biqQueryClientBuilder = BigQueryOptions.newBuilder();
    if (!AUTO_DETECT_PLACEHOLDER.equals(keyPath)) {
      biqQueryClientBuilder.setCredentials(getCredentials(keyPath));
    }
    return biqQueryClientBuilder.build().getService();
  }

  public static Storage createStorageClient(String keyPath) {
    StorageOptions.getDefaultInstance().getService();

    StorageOptions.Builder storageClientBuilder = StorageOptions.newBuilder();
    if (!AUTO_DETECT_PLACEHOLDER.equals(keyPath)) {
      storageClientBuilder.setCredentials(getCredentials(keyPath));
    }
    return storageClientBuilder.build().getService();
  }

  private static Credentials getCredentials(String keyPath) {
    try (FileInputStream serviceAccountStream = new FileInputStream(new File(keyPath))) {
      return ServiceAccountCredentials.fromStream(serviceAccountStream);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
