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
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.FieldValueList;
import com.google.cloud.bigquery.Job;
import com.google.cloud.bigquery.JobId;
import com.google.cloud.bigquery.JobInfo;
import com.google.cloud.bigquery.QueryJobConfiguration;
import com.google.cloud.bigquery.TableResult;
import com.google.cloud.pso.common.GCPUtils;
import com.google.cloud.pso.firestore.dao.CheckpointDAO;
import java.io.IOException;
import java.util.UUID;
import javax.annotation.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** CheckPointUpdateFunction class to interface between CheckPointUpdateAction and CheckpointDAO. */
public class CheckPointUpdateFunction {

  private static final Logger LOG = LoggerFactory.getLogger(CheckPointUpdateFunction.class);

  private CheckpointDAO getCheckpointDAO(String serviceAccountFilePath, String projectId) {
    com.google.cloud.pso.firestore.dao.CheckpointDAO pipelineCheckpointDAO =
        new com.google.cloud.pso.firestore.dao.CheckpointDAO(serviceAccountFilePath, projectId);
    return pipelineCheckpointDAO;
  }

  public void execute(
      String serviceAccountFilePath,
      String project,
      String collectionName,
      String documentName,
      String incrPullTableDataset,
      String incrPullLogTableName,
      String logTableCheckpointColumn)
      throws IOException, InterruptedException, Exception {
    CheckpointDAO checkpointDAO = getCheckpointDAO(serviceAccountFilePath, project);
    String maxTimestampValue =
        getMaxTimestampValueFromLogTable(
            serviceAccountFilePath,
            project,
            incrPullTableDataset,
            incrPullLogTableName,
            logTableCheckpointColumn);
    if (maxTimestampValue == null) {
      maxTimestampValue =
          getMaxValueFromLogTable(
              serviceAccountFilePath,
              project,
              incrPullTableDataset,
              incrPullLogTableName,
              logTableCheckpointColumn);
    }
    LOG.info("Updating maxTimestampValue == " + maxTimestampValue);
    if (maxTimestampValue != null) {
      // db.close() used in checkpointDAO.appendCheckpoint() method below throws
      // Exception
      checkpointDAO.appendCheckpoint(collectionName, documentName, maxTimestampValue);
    }
  }

  private String getMaxTimestampValueFromLogTable(
      String serviceAccountFilePath,
      String projectId,
      String incrPullTableDataset,
      String incrPullLogTableName,
      String logTableCheckpointColumn) {
    String sql = null;
    sql = "SELECT STRING(max(" + logTableCheckpointColumn + ")) as CHECKPOINT_VALUE FROM `";
    sql = sql + projectId + "." + incrPullTableDataset + "." + incrPullLogTableName + "`";
    // System.out.println(sql);
    String latestCheckpointValue = null;
    try {
      BigQuery bigquery = getBigQuery(serviceAccountFilePath, projectId);
      QueryJobConfiguration queryConfig =
          QueryJobConfiguration.newBuilder(sql).setUseLegacySql(false).build();

      JobId jobId = JobId.of(UUID.randomUUID().toString());
      Job queryJob = bigquery.create(JobInfo.newBuilder(queryConfig).setJobId(jobId).build());

      queryJob = queryJob.waitFor();

      if (queryJob == null) {
        throw new RuntimeException("Job no longer exists");
      } else if (queryJob.getStatus().getError() != null) {
        throw new RuntimeException(queryJob.getStatus().getError().toString());
      }
      TableResult result = queryJob.getQueryResults();
      for (FieldValueList row : result.iterateAll()) {
        if (row.get("CHECKPOINT_VALUE").getValue() != null) {
          latestCheckpointValue = row.get("CHECKPOINT_VALUE").getStringValue();
          if (latestCheckpointValue != null) {
            latestCheckpointValue =
                latestCheckpointValue.substring(0, latestCheckpointValue.indexOf("+"));
          }
        }
      }
      LOG.info("latestCheckpointValue == " + latestCheckpointValue);
    } catch (Exception error) {
      LOG.info(
          "checkpoint column logTableCheckpointColumn may not be a timestamp field == "
              + logTableCheckpointColumn);
      LOG.info("Error getting the latest time stmap == " + error.getMessage());
    }

    return latestCheckpointValue;
  }

  private String getMaxValueFromLogTable(
      String serviceAccountFilePath,
      String projectId,
      String incrPullTableDataset,
      String incrPullLogTableName,
      String logTableCheckpointColumn)
      throws InterruptedException, IOException {
    String sql = null;
    sql = "SELECT max(" + logTableCheckpointColumn + ") as CHECKPOINT_VALUE FROM `";
    sql = sql + projectId + "." + incrPullTableDataset + "." + incrPullLogTableName + "`";
    // System.out.println(sql);
    String latestCheckpointValue = null;
    BigQuery bigquery = getBigQuery(serviceAccountFilePath, projectId);
    QueryJobConfiguration queryConfig =
        QueryJobConfiguration.newBuilder(sql).setUseLegacySql(false).build();

    JobId jobId = JobId.of(UUID.randomUUID().toString());
    Job queryJob = bigquery.create(JobInfo.newBuilder(queryConfig).setJobId(jobId).build());

    queryJob = queryJob.waitFor();

    if (queryJob == null) {
      throw new RuntimeException("Job no longer exists");
    } else if (queryJob.getStatus().getError() != null) {
      throw new RuntimeException(queryJob.getStatus().getError().toString());
    }
    TableResult result = queryJob.getQueryResults();
    for (FieldValueList row : result.iterateAll()) {
      if (row.get("CHECKPOINT_VALUE").getValue() != null) {
        latestCheckpointValue = row.get("CHECKPOINT_VALUE").getStringValue();
      }
    }
    LOG.info("latestCheckpointValue == " + latestCheckpointValue);
    return latestCheckpointValue;
  }

  private BigQuery getBigQuery(@Nullable String serviceAccountFilePath, @Nullable String project)
      throws IOException {
    BigQuery bigQuery = null;
    if (serviceAccountFilePath != null || project != null) {
      BigQueryOptions.Builder bigQueryBuilder = BigQueryOptions.newBuilder();
      if (serviceAccountFilePath != null) {
        bigQueryBuilder.setCredentials(
            GCPUtils.loadServiceAccountCredentials(serviceAccountFilePath));
      }
      if (project != null) {
        bigQueryBuilder.setProjectId(project);
      }
      bigQuery = bigQueryBuilder.build().getService();
    } else {
      bigQuery = BigQueryOptions.getDefaultInstance().getService();
    }
    return bigQuery;
  }
}
