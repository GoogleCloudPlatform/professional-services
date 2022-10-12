/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator;


import com.google.cloud.pso.bqexternalviewgenerator.audit.AuditService;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.BigQueryResourceCreator;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.BigQueryResourceHandler;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.BigQueryService;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.drop.BigQueryDropResourceHandler;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.filter.ResourceFilterHandler;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveMetaStoreHandler;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveTableHandler;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Log4j2
@Component
@Profile("!test")
public class HiveBigQueryExternalViewGenerator implements CommandLineRunner {
  @Autowired AuditService auditService;
  @Autowired ViewGeneratorProperties configs;
  @Autowired BigQueryService bigQueryService;
  @Autowired ResourceFilterHandler resourceFilterHandler;
  @Autowired HiveMetaStoreHandler hiveMetaStoreHandler;
  @Autowired BigQueryResourceCreator bigqueryResourceCreator;
  @Autowired BigQueryDropResourceHandler bigqueryDropResourceHandler;

  // This is to gracefully terminate the process
  @Autowired private ApplicationContext context;

  ConcurrentHashMap<String, HiveTableHandler> hiveTableHandlers;
  ArrayList<String> hiveDBs;

  @Override
  public void run(String[] args) {
    Date startTime = new Date();
    Date metadataCompleteTime;
    Date endTime;

    try {
      collectHiveTablesFromMetastore();
      metadataCompleteTime = new Date();

      if (hiveTableHandlers == null || hiveTableHandlers.keySet().size() == 0)
        log.info("All Hive Tables are filtered out or not present. ");
      else processHiveTables();

      // Drop out of sync tables and views in BQ datasets based on the sync flag
      if (configs.bigquery.hiveBQSync) {
        // Keep Hive and BQ in Sync
        // There are certain cases where bigquery resources are obsolete
        // as the corresponding entries are not present in the hive Metastore (possible hive
        // deletions at the time of metastore scan or manual tables/views created )
        String outputState = bigqueryDropResourceHandler.dropOutOfSyncBQResources();
        log.info(String.format("Drop Out of Sync Tables SQL Execution States: %s", outputState));
      }

      endTime = new Date();
      logStatistics(startTime, metadataCompleteTime, endTime);

    } catch (Exception ex) {
      ex.printStackTrace();
      // Exit with unsuccesful termination
      System.exit(SpringApplication.exit(context, () -> -1));
    }

    // Exit with successful termination
    System.exit(SpringApplication.exit(context, () -> 0));
  }

  private void collectHiveTablesFromMetastore() throws Exception {
    // Read Hive Metastore
    hiveDBs = hiveMetaStoreHandler.getAllHiveDBs();
    log.info(String.format("Total %d Hive DB in metastore: %s", hiveDBs.size(), hiveDBs));
    hiveDBs = resourceFilterHandler.filterHiveDBs(hiveDBs);

    if (hiveDBs == null || hiveDBs.size() == 0) {
      log.info("All Hive DBs are either filtered out or not present");
      return;
    }

    hiveTableHandlers = hiveMetaStoreHandler.getAllHiveTableHandlers(hiveDBs);

    // Filtering is done later to ensure all hive metadata for a database is captured
    try {
      hiveTableHandlers =
          resourceFilterHandler.filterHiveHandlersUsingAuditTables(hiveTableHandlers);

      log.info(
          String.format(
              "Final number of Hive Tables to be processed : %d",
              Objects.isNull(hiveTableHandlers) ? 0 : hiveTableHandlers.keySet().size()));
    } catch (Exception e) {
      e.printStackTrace();
      log.info(
          "Alternative Filtering via local objects. Skipping Delta Check (generally expected in first run)");
      hiveTableHandlers = resourceFilterHandler.filterHiveHandlersLocally(hiveTableHandlers);
    }
  }

  private void processHiveTables() throws Exception {
    BigQueryResourceHandler bigQueryResourceHandler =
        new BigQueryResourceHandler(
            hiveTableHandlers,
            hiveDBs,
            bigQueryService,
            auditService,
            bigqueryResourceCreator,
            configs);
    // Create BigQuery Datasets and then view on top of the information schema tables
    bigQueryResourceHandler.generateAllBQDatasets();

    // Creates the view datasets as authorized datasets so that users don't require access to
    // external dataset
    // Checking if authorize dataset is true / false at this step is not useful,
    // If authorizeDataset is set as false, then ensure that the source dataset acl for target is
    // removed
    // if (configs.bigquery.authorizeViewDatasets)
    bigQueryResourceHandler.authorizeDatasets();

    auditService.createBQMetastoreStatsView(hiveDBs);
    // Can only be done after the dataset has been created (otherwise will error in first run)
    auditService.loadHiveMetastoreStatsToBQ();

    // Create BigQuery External Tables and Views
    bigQueryResourceHandler.generateAllBigqueryResources();
    auditService.loadToolExecutionStatsToBQ();
    auditService.close();
  }

  private void logStatistics(Date startTime, Date metadataCompleteTime, Date endTime) {
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    log.info("Execution Complete.");
    log.info("Configurations : " + configs);
    log.info(
        String.format(
            "Statistics : \n"
                + " Start Time: %s\n"
                + " Hive Metastore Collection Complete Time: %s\n"
                + " End Time: %s\n"
                + " Total Execution Time(sec): %d\n",
            sdf.format(startTime),
            sdf.format(metadataCompleteTime),
            sdf.format(endTime),
            (int) (endTime.getTime() - startTime.getTime()) / 1000));
  }
}
