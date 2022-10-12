/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery;


import avro.shaded.com.google.common.collect.ImmutableList;
import com.google.api.gax.paging.Page;
import com.google.cloud.bigquery.*;
import com.google.cloud.bigquery.JobInfo.CreateDisposition;
import com.google.cloud.bigquery.JobInfo.WriteDisposition;
import com.google.cloud.bigquery.JobStatistics.LoadStatistics;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import com.google.common.collect.Lists;
import java.io.OutputStream;
import java.nio.channels.Channels;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Log4j2
@Component
public class BigQueryService {
  @Autowired ViewGeneratorProperties configs;
  @Autowired private BigQuery bigqueryClient;

  public static final String SUCCESS_STATE = "SUCCESS";

  public BigQuery getBigQueryClient() {
    return bigqueryClient;
  }

  public String executeSql(String sql, Boolean dryRun) {
    try {
      log.debug("Executing BQ Query : \n" + sql);
      QueryJobConfiguration tableCreateQueryConfig =
          QueryJobConfiguration.newBuilder(sql).setDryRun(dryRun).setUseLegacySql(false).build();

      // Removing this as there were multiple clashing jobids (maybe due to excessive concurrency of
      // 200)
      // String jobName = "externalViewCreatorId_" + UUID.randomUUID().toString();
      JobId jobId =
          JobId.newBuilder()
              .setLocation(configs.bigquery.location)
              // .setJob(jobName)
              .build();

      Job queryJob = bigqueryClient.create(JobInfo.of(jobId, tableCreateQueryConfig));

      queryJob = queryJob.waitFor();
      String parentJobId = queryJob.getJobId().getJob();
      log.debug(
          String.format(
              "Parent Job Id: %s, Status: %s", parentJobId, queryJob.getStatus().getState()));

      // Fetch jobs created by the SQL script.
      Page<Job> childJobs =
          bigqueryClient.listJobs(BigQuery.JobListOption.parentJobId(parentJobId));
      childJobs
          .iterateAll()
          .forEach(
              job -> {
                if (job.getStatus().getError() != null)
                  log.debug(
                      String.format(
                          "Parent JobID: %s, Child Job Id: %s, Status: %s",
                          parentJobId,
                          job.getJobId().getJob(),
                          job.getStatus().getError().toString()));
                else
                  log.debug(
                      String.format(
                          "\"Parent JobID: %s, Child Job Id: %s, Status: %s",
                          parentJobId, job.getJobId().getJob(), job.getStatus().getState()));
              });
      log.info("BQ Query Execution Complete");
      return SUCCESS_STATE;

    } catch (BigQueryException e) {
      e.printStackTrace();
      return "ERROR: " + e.toString();

    } catch (InterruptedException ex) {
      log.error(ex.getMessage());
      return "ERROR: " + ex.toString();
    }
  }

  public String executeSQLsInBatches(ArrayList<String> sqls, int batchSize) {
    AtomicInteger counter = new AtomicInteger(0);
    return Lists.partition(sqls, batchSize)
        .parallelStream()
        .map(
            sqlBatch ->
                String.format(
                    "Batch #%d State: %s",
                    counter.incrementAndGet(), executeSql(String.join("\n", sqlBatch), false)))
        .collect(Collectors.joining("\n"));
  }

  public TableResult getQueryResults(String query) throws Exception {
    log.debug("Executing BQ Query : \n" + query);

    QueryJobConfiguration tableCreateQueryConfig =
        QueryJobConfiguration.newBuilder(query).setUseLegacySql(false).build();

    JobId jobId = JobId.newBuilder().setLocation(configs.bigquery.location).build();
    Job queryJob = bigqueryClient.create(JobInfo.of(jobId, tableCreateQueryConfig));
    queryJob = queryJob.waitFor();
    return queryJob.getQueryResults();
  }

  public long writeJsonFileToTable(
      WriteChannelConfiguration writeChannelConfiguration, String jsonFilePath) {
    try {
      Path jsonfile = Paths.get(jsonFilePath);
      // The location must be specified; other fields can be auto-detected.
      JobId jobId = JobId.newBuilder().setLocation(configs.bigquery.location).build();
      TableDataWriteChannel writer = bigqueryClient.writer(jobId, writeChannelConfiguration);

      // Write data to writer
      try (OutputStream stream = Channels.newOutputStream(writer)) {
        Files.copy(jsonfile, stream);
      }
      // Get load job
      Job job = writer.getJob();
      job = job.waitFor();
      LoadStatistics stats = job.getStatistics();
      return stats.getOutputRows();

    } catch (Exception e) {
      e.printStackTrace();
      log.error("Bigquery Error While Loading JSON File: ", e);
    }
    return 0;
  }

  public long writeJsonFileToTable(
      TableId biqQueryTableId, String jsonFilePath, Schema tableSchema) {

    WriteChannelConfiguration.Builder writeChannelConfigurationBuilder =
        WriteChannelConfiguration.newBuilder(biqQueryTableId)
            .setFormatOptions(FormatOptions.json())
            .setAutodetect(true)
            .setCreateDisposition(CreateDisposition.CREATE_IF_NEEDED)
            .setWriteDisposition(WriteDisposition.WRITE_TRUNCATE);

    WriteChannelConfiguration writeChannelConfiguration =
        (tableSchema != null)
            ? writeChannelConfigurationBuilder.setSchema(tableSchema).build()
            : writeChannelConfigurationBuilder.build();

    return writeJsonFileToTable(writeChannelConfiguration, jsonFilePath);
  }

  // This method will update userDataset's ACL with sourceDataset's ACL
  // https://cloud.google.com/bigquery/docs/authorized-datasets#authorized_dataset_example
  public void authorizeDataset(DatasetId sourceDatasetId, DatasetId userDatasetId) {
    try {
      // Get both source and user dataset's references
      Dataset sourceDataset = bigqueryClient.getDataset(sourceDatasetId);

      // Get the source dataset's ACL
      List<Acl> sourceDatasetAcl = new ArrayList<>(sourceDataset.getAcl());

      // Add the user dataset's DatasetAccessEntry object to the existing sourceDatasetAcl
      List<String> targetTypes = ImmutableList.of("VIEWS");
      Acl.DatasetAclEntity userDatasetAclEntity =
          new Acl.DatasetAclEntity(userDatasetId, targetTypes);

      Acl userDatasetAcl = Acl.of(userDatasetAclEntity);

      if (configs.bigquery.authorizeViewDatasets) {
        if (sourceDatasetAcl.contains(userDatasetAcl)) {
          log.info(
              String.format(
                  "Dataset %s already contains authorization\n", sourceDataset.getDatasetId()));
          return;
        }
        log.info(
            String.format(
                "Adding userDataset Entry in Source Dataset %s\n", sourceDataset.getDatasetId()));
        sourceDatasetAcl.add(userDatasetAcl);
      } else {
        // If authorizedDataset is false, then remove authorization from source dataset
        if (sourceDatasetAcl.contains(userDatasetAcl)) {
          log.info(
              String.format(
                  "Removing userDataset Entry in Source Dataset %s\n",
                  sourceDataset.getDatasetId()));
          sourceDatasetAcl.remove(userDatasetAcl);
        } else {
          log.info(
              String.format(
                  "Dataset %s doesn't contain authorization\n", sourceDataset.getDatasetId()));
          return;
        }
      }

      // update the user dataset with source dataset's ACL
      Dataset updatedSourceDataset =
          sourceDataset.toBuilder().setAcl(sourceDatasetAcl).build().update();

      log.info(
          String.format(
              "Dataset %s updated with required authorization information\n",
              updatedSourceDataset.getDatasetId()));

    } catch (BigQueryException e) {
      log.error("Dataset Authorization failed due to error: \n" + e);
    }
  }
}
