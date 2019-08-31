/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.gceusage.services;

import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.FormatOptions;
import com.google.cloud.bigquery.Job;
import com.google.cloud.bigquery.JobId;
import com.google.cloud.bigquery.JobInfo.WriteDisposition;
import com.google.cloud.bigquery.JobStatistics;
import com.google.cloud.bigquery.Schema;
import com.google.cloud.bigquery.Table;
import com.google.cloud.bigquery.TableDataWriteChannel;
import com.google.cloud.bigquery.TableId;
import com.google.cloud.bigquery.WriteChannelConfiguration;
import com.google.common.flogger.FluentLogger;
import com.google.gson.Gson;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.channels.Channels;
import java.util.Collection;
import org.apache.commons.fileupload.util.Streams;

public class BQHelper {

  private static final FluentLogger logger = FluentLogger.forEnclosingClass();

  /**
   * This appends into the BQ table specified in the input argument with the data in the input
   * argument rows. Each object in rows is first converted to json and uploaded to BigQuery. Types
   * are autodeteced.
   *
   * @param datasetName the name of the dataset where the rows should be written. Example:
   *     gce_capacity_log
   * @param tableName the table name where the rows should be written. Example: machine_types
   * @param rows the data to be written to BQ
   */
  public static JobStatistics insertIntoTable(
      String projectId,
      String datasetName,
      String tableName,
      Schema schema,
      Collection<Object> rows)
      throws IOException, InterruptedException, EmptyRowCollection {
    if (rows.isEmpty()) {
      throw new EmptyRowCollection("The input data was empty.");
    }

    Gson gson = new Gson();

    BigQuery bigquery = BigQueryOptions.getDefaultInstance().getService();
    TableId tableId = TableId.of(projectId, datasetName, tableName);

    StringBuilder sb = new StringBuilder();

    WriteChannelConfiguration writeChannelConfiguration =
        WriteChannelConfiguration.newBuilder(tableId)
            .setFormatOptions(FormatOptions.json())
            .setSchema(schema)
            .setWriteDisposition(WriteDisposition.WRITE_APPEND)
            .build();
    JobId jobId = JobId.newBuilder().build();
    TableDataWriteChannel writer = bigquery.writer(jobId, writeChannelConfiguration);

    for (Object row : rows) {
      sb.append(gson.toJson(row));
      sb.append("\n");
    }

    try (OutputStream stream = Channels.newOutputStream(writer)) {
      Streams.copy(new ByteArrayInputStream(sb.toString().getBytes()), stream, false);
    }

    Job job = writer.getJob();
    job = job.waitFor();
    return job.getStatistics();
  }

  /**
   * This appends into the BQ table specified in the input argument with the data in the input
   * argument rows. Each object in rows is first converted to json and uploaded to BigQuery.
   *
   * @param datasetName the name of the dataset where the rows should be written. Example:
   *     gce_capacity_log
   * @param tableName the table name where the rows should be written. Example: machine_types
   * @param rows the data to be written to BQ
   */
  public static JobStatistics insertIntoTable(Table table, Schema schema, Collection<Object> rows)
      throws IOException, InterruptedException, EmptyRowCollection {

    if (rows.isEmpty()) {
      throw new EmptyRowCollection("The input data was empty.");
    }

    Gson gson = new Gson();

    BigQuery bigquery = BigQueryOptions.getDefaultInstance().getService();
    TableId tableId = table.getTableId();

    StringBuilder sb = new StringBuilder();

    WriteChannelConfiguration writeChannelConfiguration =
        WriteChannelConfiguration.newBuilder(tableId)
            .setFormatOptions(FormatOptions.json())
            .setSchema(schema)
            .setWriteDisposition(WriteDisposition.WRITE_APPEND)
            .build();

    JobId jobId = JobId.newBuilder().build();
    TableDataWriteChannel writer = bigquery.writer(jobId, writeChannelConfiguration);

    for (Object row : rows) {
      sb.append(gson.toJson(row));
      sb.append("\n");
    }
    logger.atInfo().log("Writing table data: " + sb.toString());
    try (OutputStream stream = Channels.newOutputStream(writer)) {
      Streams.copy(new ByteArrayInputStream(sb.toString().getBytes()), stream, false);
    }

    Job job = writer.getJob();
    job = job.waitFor();
    return job.getStatistics();
  }

  /**
   * Deletes the table specified in the input arguments.
   *
   * @param datasetName the name of the dataset
   * @param tableName the table to be deleted
   */
  public static void deleteTable(String project, String datasetName, String tableName) {
    BigQuery bigquery = BigQueryOptions.getDefaultInstance().getService();
    TableId tableId = TableId.of(project, datasetName, tableName);

    bigquery.delete(tableId);
  }
}
