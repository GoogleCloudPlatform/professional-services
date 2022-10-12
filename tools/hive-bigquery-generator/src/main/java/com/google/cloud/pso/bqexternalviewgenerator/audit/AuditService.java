/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.audit;

import static org.apache.commons.lang3.StringUtils.isBlank;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.bigquery.Clustering;
import com.google.cloud.bigquery.FormatOptions;
import com.google.cloud.bigquery.JobInfo.CreateDisposition;
import com.google.cloud.bigquery.JobInfo.WriteDisposition;
import com.google.cloud.bigquery.TableId;
import com.google.cloud.bigquery.TimePartitioning;
import com.google.cloud.bigquery.WriteChannelConfiguration;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.BigQueryResource;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.BigQueryService;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.BigQueryUtil;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.dataset.BigQueryDatasetHandler;
import com.google.cloud.pso.bqexternalviewgenerator.common.FileWriteService;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveTableHandler;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Log4j2
@Component
public class AuditService {
  @Autowired ViewGeneratorProperties configs;
  @Autowired BigQueryService bigQueryService;
  private static final ObjectMapper mapper = new ObjectMapper();
  private FileWriteService bqResourceFileWriter = null;
  private String bqResourceStatsFile;
  private AtomicInteger bqResourceCounter;
  private FileWriteService hiveMetaFileWriter = null;
  private String hiveMetastoreStatsFile;
  private AtomicInteger hiveMetaCounter;

  public void initAll() throws Exception {
    initBQResourceWriter();
    initHiveMetaWriter();
  }

  private void initBQResourceWriter() throws Exception {
    if (Objects.isNull(bqResourceFileWriter)) {
      bqResourceStatsFile =
          String.format(
              "%s/%s",
              configs.logfiles.outputFolder,
              isBlank(configs.logfiles.bigqueryExecutionStatsFile)
                  ? configs.bigquery.audit.toolExecutionStatsTable + ".json"
                  : configs.logfiles.bigqueryExecutionStatsFile);

      bqResourceFileWriter = new FileWriteService(bqResourceStatsFile);
      bqResourceCounter = new AtomicInteger(0);
    }
  }

  private void initHiveMetaWriter() throws Exception {
    if (Objects.isNull(hiveMetaFileWriter)) {
      hiveMetastoreStatsFile =
          String.format(
              "%s/%s",
              configs.logfiles.outputFolder,
              isBlank(configs.logfiles.hiveMetastoreStatsFile)
                  ? configs.bigquery.audit.hiveMetastoreStatsTable + ".json"
                  : configs.logfiles.hiveMetastoreStatsFile);

      hiveMetaFileWriter = new FileWriteService(hiveMetastoreStatsFile);
      hiveMetaCounter = new AtomicInteger(0);
    }
  }

  public void storeBQResource(BigQueryResource bigqueryResource) throws Exception {
    if (bqResourceFileWriter == null) initBQResourceWriter();
    String jsonString = mapper.writeValueAsString(bigqueryResource);
    bqResourceFileWriter.store(jsonString + "\n");
    log.info(
        String.format(
            "AUDIT: %d. Serialized BQ Resource Object for the Hive Table: %s",
            bqResourceCounter.incrementAndGet(), bigqueryResource.getHiveTableId()));
  }

  public void storeHiveTableStats(HiveTableHandler hiveTableHandler) throws Exception {
    if (hiveMetaFileWriter == null) initHiveMetaWriter();
    String jsonString = mapper.writeValueAsString(hiveTableHandler.getHiveTable());
    hiveMetaFileWriter.store(jsonString + "\n");
    log.info(
        String.format(
            "AUDIT: %d. Serialized HiveTable: %s object",
            hiveMetaCounter.incrementAndGet(), hiveTableHandler.getHiveTableId()));
  }

  public void createBQMetastoreStatsView(ArrayList<String> hiveDBs) {
    log.info("Initiating Creation of BigQuery Metastore View");
    BigQueryDatasetHandler bigqueryDatasetHandler = new BigQueryDatasetHandler(hiveDBs, configs);
    String targetViewName = BigQueryUtil.getBQMetastoreStatsViewId(configs);

    String state =
        bigQueryService.executeSql(
            bigqueryDatasetHandler.makeBQMetastoreViewDDL(targetViewName), false);
    log.info(
        String.format(
            "AUDIT: State: %s, Created BQ Metastore Stats View : %s", state, targetViewName));
  }

  public int loadToolExecutionStatsToBQ() throws IOException, InterruptedException {
    // closeBQResourceWriter();
    log.info("Loading BigQuery Resource Creation Stats to BigQuery");
    if (bqResourceCounter.get() > 0) {
      TableId targetBQTableId =
          TableId.of(
              configs.bigquery.project,
              configs.bigquery.audit.dataset,
              configs.bigquery.audit.toolExecutionStatsTable);

      // Setting a time partition in the table might be counterproductive in case
      // delta processing flag is on, many hive bq mapping table will be lost.
      // Its productive when delta processing flag is off
      // Commenting out partitioning for now.
      WriteChannelConfiguration writeChannelConfiguration =
          WriteChannelConfiguration.newBuilder(targetBQTableId)
              .setFormatOptions(FormatOptions.json())
              .setAutodetect(true)
              .setSchema(BigQueryAuditTableSchemas.getBQResourceSchema())
              .setWriteDisposition(WriteDisposition.WRITE_APPEND)
              .setCreateDisposition(CreateDisposition.CREATE_IF_NEEDED)
              .setTimePartitioning(
                  TimePartitioning.newBuilder(TimePartitioning.Type.DAY)
                      .setField("created_at")
                      // .setExpirationMs(
                      //     (long)
                      //         (configs.bigquery.audit.toolStatsTablePartitionExpiryDays
                      //             * 24
                      //             * 60
                      //             * 60
                      //             * 1000))
                      .build())
              .setClustering(Clustering.newBuilder().setFields(Arrays.asList("hiveTableId", "runId")).build())
              .build();

      long rowsWritten =
          bigQueryService.writeJsonFileToTable(writeChannelConfiguration, bqResourceStatsFile);

      log.info(
          String.format(
              "AUDIT: Successfully Wrote %d rows out of %d to the BQ Table %s",
              rowsWritten, bqResourceCounter.get(), targetBQTableId));
    } else log.info("AUDIT: No Bigquery Resource to be created.");

    return bqResourceCounter.get();
  }

  public int loadHiveMetastoreStatsToBQ() throws IOException, InterruptedException {
    // closeHiveStatsWriter();
    log.info("Loading Hive Metastore Audit Stats to BigQuery");
    if (hiveMetaCounter.get() > 0) {
      TableId targetBQTableId =
          TableId.of(
              configs.bigquery.project,
              configs.bigquery.audit.dataset,
              configs.bigquery.audit.hiveMetastoreStatsTable);

      long rowsWritten =
          bigQueryService.writeJsonFileToTable(
              targetBQTableId,
              hiveMetastoreStatsFile,
              BigQueryAuditTableSchemas.getHiveStatsSchema());

      log.info(
          String.format(
              "AUDIT: Successfully Wrote %d rows out of %d to the BQ Table %s",
              rowsWritten, hiveMetaCounter.get(), targetBQTableId));
    } else log.info("AUDIT: All hive tables filters or not present. ");

    return hiveMetaCounter.get();
  }

  public void close() {
    bqResourceFileWriter.closeFile();
    hiveMetaFileWriter.closeFile();
  }

  public void closeHiveStatsWriter() {
    hiveMetaFileWriter.closeFile();
  }

  public void closeBQResourceWriter() {
    bqResourceFileWriter.closeFile();
  }

  public ViewGeneratorProperties getConfigs() {
    return this.configs;
  }
}
