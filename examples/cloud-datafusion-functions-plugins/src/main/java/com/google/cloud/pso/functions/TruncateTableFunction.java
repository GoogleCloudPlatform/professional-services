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
import com.google.cloud.bigquery.FieldValueList;
import com.google.cloud.bigquery.Job;
import com.google.cloud.bigquery.JobId;
import com.google.cloud.bigquery.JobInfo;
import com.google.cloud.bigquery.QueryJobConfiguration;
import com.google.cloud.bigquery.StandardTableDefinition;
import com.google.cloud.bigquery.Table;
import com.google.cloud.bigquery.TableId;
import com.google.cloud.bigquery.TableResult;
import com.google.cloud.bigquery.TimePartitioning;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.util.UUID;

/** This class contains the logic to truncate table. */
public class TruncateTableFunction {

  public static void truncateTable(
      String keyPath, String projectId, String dataset, String tableName) {
    try {
      BigQuery bigquery = Utils.createBigQueryClient(keyPath);

      String query = "SELECT * FROM `{projectId}`.`{dataset}`.`{tableName}` where 1 = 0";

      query = query.replace("{projectId}", projectId);
      query = query.replace("{dataset}", dataset);
      query = query.replace("{tableName}", tableName);

      TableId sourceTableId = TableId.of(projectId, dataset, tableName);
      Table sourceTable = bigquery.getTable(sourceTableId);
      TimePartitioning sourceTablePartitioning = getTablePartitioning(sourceTable);

      TableId destinationTable = TableId.of(projectId, dataset, tableName + "_tmp");

      System.out.println(query);
      QueryJobConfiguration queryConfig =
          QueryJobConfiguration.newBuilder(query)
              .setUseLegacySql(false)
              .setDestinationTable(destinationTable)
              .setTimePartitioning(sourceTablePartitioning)
              .setCreateDisposition(JobInfo.CreateDisposition.CREATE_IF_NEEDED)
              .setWriteDisposition(JobInfo.WriteDisposition.WRITE_TRUNCATE)
              .build();

      JobId jobId = JobId.of(UUID.randomUUID().toString());
      Job queryJob = bigquery.create(JobInfo.newBuilder(queryConfig).setJobId(jobId).build());
      queryJob.waitFor();

      if (queryJob == null) {
        throw new RuntimeException("Job no longer exists");
      } else if (queryJob.getStatus().getError() != null) {
        throw new RuntimeException(queryJob.getStatus().getError().toString());
      }

      query = "DROP TABLE `{projectId}`.`{dataset}`.`{tableName}`";
      query = query.replace("{projectId}", projectId);
      query = query.replace("{dataset}", dataset);
      query = query.replace("{tableName}", tableName);

      queryConfig = QueryJobConfiguration.newBuilder(query).setUseLegacySql(false).build();

      jobId = JobId.of(UUID.randomUUID().toString());
      queryJob = bigquery.create(JobInfo.newBuilder(queryConfig).setJobId(jobId).build());
      queryJob.waitFor();

      if (queryJob == null) {
        throw new RuntimeException("Job no longer exists");
      } else if (queryJob.getStatus().getError() != null) {
        throw new RuntimeException(queryJob.getStatus().getError().toString());
      }

      query = "SELECT * FROM `{projectId}`.`{dataset}`.`{tableName}_tmp` where 1 = 0";

      query = query.replace("{projectId}", projectId);
      query = query.replace("{dataset}", dataset);
      query = query.replace("{tableName}", tableName);

      destinationTable = TableId.of(projectId, dataset, tableName);

      queryConfig =
          QueryJobConfiguration.newBuilder(query)
              .setUseLegacySql(false)
              .setDestinationTable(destinationTable)
              .setTimePartitioning(sourceTablePartitioning)
              .setCreateDisposition(JobInfo.CreateDisposition.CREATE_IF_NEEDED)
              .setWriteDisposition(JobInfo.WriteDisposition.WRITE_TRUNCATE)
              .build();

      jobId = JobId.of(UUID.randomUUID().toString());
      queryJob = bigquery.create(JobInfo.newBuilder(queryConfig).setJobId(jobId).build());
      queryJob.waitFor();

      if (queryJob == null) {
        throw new RuntimeException("Job no longer exists");
      } else if (queryJob.getStatus().getError() != null) {
        throw new RuntimeException(queryJob.getStatus().getError().toString());
      }

      query = "DROP TABLE `{projectId}`.`{dataset}`.`{tableName}_tmp`";
      query = query.replace("{projectId}", projectId);
      query = query.replace("{dataset}", dataset);
      query = query.replace("{tableName}", tableName);

      queryConfig = QueryJobConfiguration.newBuilder(query).setUseLegacySql(false).build();

      jobId = JobId.of(UUID.randomUUID().toString());
      queryJob = bigquery.create(JobInfo.newBuilder(queryConfig).setJobId(jobId).build());
      queryJob.waitFor();

      if (queryJob == null) {
        throw new RuntimeException("Job no longer exists");
      } else if (queryJob.getStatus().getError() != null) {
        throw new RuntimeException(queryJob.getStatus().getError().toString());
      }

    } catch (Exception ex) {
      ex.printStackTrace();
    }
  }

  public static void updateTableField(
      String keyPath,
      String projectId,
      String dataset,
      String tableName,
      String field,
      String value,
      String where) {
    BigQuery bigquery = Utils.createBigQueryClient(keyPath);

    String query =
        String.format(
            "UPDATE `%s`.`%s`.`%s` SET %s = %s WHERE %s",
            projectId, dataset, tableName, field, value, where);

    QueryJobConfiguration queryConfig =
        QueryJobConfiguration.newBuilder(query).setUseLegacySql(false).build();

    JobId jobId = JobId.of(UUID.randomUUID().toString());
    Job queryJob = bigquery.create(JobInfo.newBuilder(queryConfig).setJobId(jobId).build());
    try {
      queryJob.waitFor();
    } catch (Exception e) {
      System.out.println(e.getMessage());
      throw new RuntimeException(queryJob.getStatus().getError().toString());
    }

    if (queryJob == null) {
      throw new RuntimeException("Job no longer exists");
    } else if (queryJob.getStatus().getError() != null) {
      throw new RuntimeException(queryJob.getStatus().getError().toString());
    }
  }

  private static String getTableValue(
      String keyPath,
      String projectId,
      String dataset,
      String tableName,
      String field,
      String where)
      throws InterruptedException, InvocationTargetException {
    String result = "0";

    BigQuery bigquery = Utils.createBigQueryClient(keyPath);

    String query =
        String.format(
            "SELECT %s FROM `%s`.`%s`.`%s` WHERE %s", field, projectId, dataset, tableName, where);

    QueryJobConfiguration queryConfig =
        QueryJobConfiguration.newBuilder(query).setUseLegacySql(false).build();

    JobId jobId = JobId.of(UUID.randomUUID().toString());
    Job queryJob = bigquery.create(JobInfo.newBuilder(queryConfig).setJobId(jobId).build());
    try {
      queryJob.waitFor();
    } catch (Exception e) {
      System.out.println(e.getMessage());
      throw new RuntimeException(queryJob.getStatus().getError().toString());
    }

    if (queryJob == null) {
      throw new RuntimeException("Job no longer exists");
    } else if (queryJob.getStatus().getError() != null) {
      throw new RuntimeException(queryJob.getStatus().getError().toString());
    }

    TableResult tableResult = queryJob.getQueryResults();

    for (FieldValueList row : tableResult.iterateAll()) {
      if (!row.get(field).isNull()) {
        result = row.get(field).getStringValue();
      }
    }

    return result;
  }

  private static TimePartitioning getTablePartitioning(Table table) {
    String partitionField;
    TimePartitioning.Type partitionType;
    TimePartitioning returnTimePartitioning = null;

    if (table.<StandardTableDefinition>getDefinition().getTimePartitioning() != null) {
      partitionField =
          table.<StandardTableDefinition>getDefinition().getTimePartitioning().getField();
      partitionType =
          table.<StandardTableDefinition>getDefinition().getTimePartitioning().getType();

      TimePartitioning.Builder timePartitioningBuilder = TimePartitioning.newBuilder(partitionType);
      timePartitioningBuilder.setField(partitionField);
      returnTimePartitioning = timePartitioningBuilder.build();
    }

    return returnTimePartitioning;
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
