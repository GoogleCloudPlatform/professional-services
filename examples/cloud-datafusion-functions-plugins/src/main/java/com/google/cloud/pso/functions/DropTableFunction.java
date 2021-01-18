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

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.TableId;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** This class contains the logic to do the work from DropTableAction. */
public class DropTableFunction {
  private static Logger LOG = LoggerFactory.getLogger(DropTableFunction.class);

  public static void dropTable(String keyPath, String projectId, String dataset, String tableName) {
    try {
      BigQuery bigquery = Utils.createBigQueryClient(keyPath);

      TableId tableId = TableId.of(projectId, dataset, tableName);
      boolean deleted = bigquery.delete(tableId);
      if (deleted) {
        LOG.info("Table deleted.");
      } else {
        LOG.info("Table was not found.");
      }

    } catch (Exception ex) {
      LOG.error("Query execution exception: {}", ex);
    }
  }

  private static com.google.auth.Credentials getCredentials(String keyPath) throws IOException {
    GoogleCredentials credentials;
    File credentialsPath = new File(keyPath);

    try (FileInputStream serviceAccountStream = new FileInputStream(credentialsPath)) {
      credentials = ServiceAccountCredentials.fromStream(serviceAccountStream);
    }

    return credentials;
  }
}
