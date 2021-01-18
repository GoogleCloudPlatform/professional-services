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

import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.CopyJobConfiguration;
import com.google.cloud.bigquery.Job;
import com.google.cloud.bigquery.JobId;
import com.google.cloud.bigquery.JobInfo;
import com.google.cloud.bigquery.TableId;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This class contains logic to copy tables from staging to destination at the end of the pipeline
 * run.
 */
public class InsertOverwriteFunction {
  private static Logger LOG = LoggerFactory.getLogger(InsertOverwriteFunction.class);

  private final String keyPath;
  private final String projectId;
  private final String dataSet;
  private final String tableName;

  public InsertOverwriteFunction(
      String keyPath, String projectId, String dataSet, String tableName) {
    this.keyPath = keyPath;
    this.projectId = projectId;
    this.dataSet = dataSet;
    this.tableName = tableName;
  }

  public void executeCopy() {
    try {
      BigQuery bigquery = Utils.createBigQueryClient(keyPath);

      TableId sourceTable = TableId.of(projectId, getTempDataSet(), tableName);
      TableId destinationTable = TableId.of(projectId, dataSet, tableName);

      CopyJobConfiguration queryConfig =
          CopyJobConfiguration.newBuilder(destinationTable, sourceTable)
              .setCreateDisposition(JobInfo.CreateDisposition.CREATE_IF_NEEDED)
              .setWriteDisposition(JobInfo.WriteDisposition.WRITE_TRUNCATE)
              .build();

      JobId jobId = JobId.of(UUID.randomUUID().toString());

      Job queryJob = bigquery.create(JobInfo.newBuilder(queryConfig).setJobId(jobId).build());
      queryJob.waitFor();
      LOG.info("Copy job is done: {}", queryJob.isDone());

      if (queryJob == null) {
        throw new RuntimeException("Job no longer exists");
      } else if (queryJob.getStatus().getError() != null) {
        throw new RuntimeException(queryJob.getStatus().getError().toString());
      }

    } catch (InterruptedException e) {
      LOG.error("Query execution exception: {}", e);
    }
  }

  private String getTempDataSet() {
    return dataSet + "_batch_staging";
  }
}
