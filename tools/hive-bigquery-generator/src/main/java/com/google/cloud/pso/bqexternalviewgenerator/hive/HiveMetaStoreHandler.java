/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.hive;


import com.google.cloud.pso.bqexternalviewgenerator.audit.AuditService;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.filter.ResourceFilterHandler;
import com.google.cloud.pso.bqexternalviewgenerator.common.CustomForkJoinWorkerThreadFactory;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ForkJoinPool;
import lombok.extern.log4j.Log4j2;
import org.apache.hadoop.hive.metastore.api.MetaException;
import org.apache.hadoop.hive.metastore.api.Table;
import org.apache.thrift.TException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Log4j2
@Component
public class HiveMetaStoreHandler {
  @Autowired private ViewGeneratorProperties configs;
  @Autowired private AuditService auditService;
  @Autowired private ResourceFilterHandler hiveFilterHandler;

  public ArrayList<String> getAllHiveDBs() throws TException {
    HiveMetaStoreService hiveMetaStoreService = new HiveMetaStoreService(configs);
    ArrayList<String> allHiveDBs = (ArrayList<String>) hiveMetaStoreService.getAllDatabases();
    hiveMetaStoreService.closeMetaStoreConnection();
    return allHiveDBs;
  }

  public ConcurrentHashMap<String, HiveTableHandler> getAllHiveTableHandlers(
      ArrayList<String> hiveDBs) throws Exception {
    ForkJoinPool customThreadPool =
        new ForkJoinPool(
            Math.max(configs.threadPool, Runtime.getRuntime().availableProcessors()),
            new CustomForkJoinWorkerThreadFactory(),
            null,
            false);

    ConcurrentHashMap<String, HiveTableHandler> hiveTableHandlers =
        new ConcurrentHashMap<String, HiveTableHandler>();

    customThreadPool
        .submit(
            () -> {
              hiveDBs.stream()
                  .forEach(
                      (hiveDBName) -> {
                        HiveMetaStoreService hiveMetaStoreService = null;
                        try {
                          hiveMetaStoreService = new HiveMetaStoreService(configs);
                        } catch (MetaException e) {
                          e.printStackTrace();
                        }
                        try {
                          hiveMetaStoreService
                              .getAllTables(hiveDBName)
                              .parallelStream()
                              .forEach(
                                  hiveTableName -> {
                                    HiveTableHandler hiveTableHandler;
                                    try {
                                      hiveTableHandler =
                                          getHiveTableHandler(hiveDBName, hiveTableName);
                                      // Removing filtering condition to serialize all hive meta
                                      // if (!hiveFilterHandler.isHiveTableFiltered(
                                      //     hiveTableHandler.getHiveTable())) {

                                      hiveTableHandlers.put(
                                          hiveTableHandler.getHiveTableId(), hiveTableHandler);

                                      auditService.storeHiveTableStats(hiveTableHandler);
                                      // }
                                    } catch (Exception e) {
                                      e.printStackTrace();
                                    }
                                  });
                        } catch (Exception e) {
                          e.printStackTrace();
                        }
                        hiveMetaStoreService.closeMetaStoreConnection();
                      });
            })
        .get();
    auditService.closeHiveStatsWriter();
    return hiveTableHandlers;
  }

  public HiveTableHandler getHiveTableHandler(String hivedb, String hiveTable) throws TException {
    HiveMetaStoreService hiveMetaStoreService = new HiveMetaStoreService(configs);
    Table table = hiveMetaStoreService.getTable(hivedb, hiveTable);
    hiveMetaStoreService.closeMetaStoreConnection();
    return new HiveTableHandler(table, configs.bigquery);
  }
}
