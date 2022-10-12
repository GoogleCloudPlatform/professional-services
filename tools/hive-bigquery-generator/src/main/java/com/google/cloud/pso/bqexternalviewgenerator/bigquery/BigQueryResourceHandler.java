/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery;


import com.google.cloud.pso.bqexternalviewgenerator.audit.AuditService;
import com.google.cloud.pso.bqexternalviewgenerator.common.CustomForkJoinWorkerThreadFactory;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveTableHandler;
import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ForkJoinPool;
import lombok.extern.log4j.Log4j2;

@Log4j2
public class BigQueryResourceHandler {
  private static ConcurrentHashMap<String, HiveTableHandler> hiveTableHandlers;
  private static ArrayList<String> hiveDBs;
  private BigQueryResourceCreator bigQueryResourceCreator;
  private ViewGeneratorProperties configs;
  private BigQueryService bigQueryService;
  private AuditService auditService;

  public BigQueryResourceHandler(
      ConcurrentHashMap<String, HiveTableHandler> hiveTableHandlers,
      ArrayList<String> hiveDBs,
      BigQueryService bigQueryService,
      AuditService auditService,
      BigQueryResourceCreator bigQueryResourceCreator,
      ViewGeneratorProperties configs) {
    this.hiveTableHandlers = hiveTableHandlers;
    this.hiveDBs = hiveDBs;
    this.bigQueryService = bigQueryService;
    this.bigQueryResourceCreator = bigQueryResourceCreator;
    this.configs = configs;
    this.auditService = auditService;
  }

  public void generateAllBQDatasets() {
    log.info("Generating all required datasets in BigQuery");
    bigQueryResourceCreator.generateAllBQDatasets(hiveDBs);
  }

  public void generateAllBigqueryResources() {
    try {
      ForkJoinPool customThreadPool =
          new ForkJoinPool(
              Math.max(configs.threadPool, Runtime.getRuntime().availableProcessors()),
              new CustomForkJoinWorkerThreadFactory(),
              null,
              false);

      customThreadPool
          .submit(
              () -> {
                hiveTableHandlers
                    .values()
                    .parallelStream()
                    .forEach(
                        (hiveTableHandler) -> {
                          try {
                            log.info(
                                String.format(
                                    "Processing BQ Resource generation for Hive Table: %s",
                                    hiveTableHandler.getHiveTableId()));
                            bigQueryResourceCreator.generateBigqueryResources(hiveTableHandler);
                          } catch (Exception e) {
                            e.printStackTrace();
                          }
                        });
              })
          .get();
    } catch (Exception e) {
      e.printStackTrace();
    } finally {
      bigQueryResourceCreator.closeAudit();
    }
  }

  public void authorizeDatasets() {
    log.info("Updating Authorization for all view datasets");
    bigQueryResourceCreator
        .getSourceTargetDatasetIdList(hiveDBs)
        .entrySet()
        .forEach(
            sourceTargetDataset -> {
              bigQueryService.authorizeDataset(
                  sourceTargetDataset.getKey(), sourceTargetDataset.getValue());
            });
  }
}
