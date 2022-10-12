/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery.filter;


import com.google.cloud.pso.bqexternalviewgenerator.bigquery.BigQueryService;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveTable;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveTableHandler;
import java.util.ArrayList;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Log4j2
@Component
public class ResourceFilterHandler {
  @Autowired private ViewGeneratorProperties configs;
  @Autowired private BigQueryService bigQueryService;

  public ConcurrentHashMap<String, HiveTableHandler> filterHiveHandlersLocally(
      ConcurrentHashMap<String, HiveTableHandler> hiveTableHandlers) {
    logFilterConditions();
    hiveTableHandlers.values().removeIf(handler -> isHiveTableFiltered(handler.getHiveTable()));
    return hiveTableHandlers;
  }

  public boolean isHiveTableFiltered(HiveTable hiveTable) {
    boolean isFiltered =
        (configs.hive.filters.fileFormatDenyList.stream()
                .anyMatch(
                    ((hiveTable.getSerde() == null) ? "" : hiveTable.getSerde().toString())
                        ::equalsIgnoreCase)
            || configs.hive.filters.tableTypeDenyList.stream()
                .anyMatch(hiveTable.getTableType()::equalsIgnoreCase)
            || configs.hive.filters.tableDenyList.stream()
                .anyMatch(hiveTable.getFullyQualifiedTableName()::equalsIgnoreCase)
            || configs.hive.filters.fileFormatDenyList.contains("*")
            || configs.hive.filters.tableTypeDenyList.contains("*")
            || configs.hive.filters.tableDenyList.contains("*")
            || !(configs.hive.filters.tableAllowList.stream()
                    .anyMatch(hiveTable.getFullyQualifiedTableName()::equalsIgnoreCase)
                || configs.hive.filters.tableAllowList.contains("*")));

    if (isFiltered == true)
      log.info(String.format("Hive Table: %s is filtered", hiveTable.getTableName()));

    return isFiltered;
  }

  public ArrayList<String> filterHiveDBs(ArrayList<String> hiveDBs) {
    log.info("Filtering Hive Databases based on following allow lists:\n");
    log.info(String.format("HiveDatabase Allow List: %s:", configs.hive.filters.dbAllowList));
    hiveDBs.removeIf(hivedb -> isHiveDBFiltered(hivedb));
    return hiveDBs;
  }

  public boolean isHiveDBFiltered(String hiveDBName) {
    boolean isFiltered =
        !(configs.hive.filters.dbAllowList.contains("*")
            || configs.hive.filters.dbAllowList.stream().anyMatch(hiveDBName::equalsIgnoreCase));

    if (isFiltered == true) log.info(String.format("Hive DB: %s is filtered", hiveDBName));

    return isFiltered;
  }

  public ConcurrentHashMap<String, HiveTableHandler> filterHiveHandlersUsingAuditTables(
      ConcurrentHashMap<String, HiveTableHandler> hiveTableHandlers) throws Exception {
    logFilterConditions();
    if (isAllFiltered()) {
      log.info("All Filtered Flag on");
      return null;
    }

    String filterHiveTablesSQL = BigQueryFilterQueryCreator.makeFilterHiveTablesSQL(configs);
    log.info(String.format("Filtering Hive Tables using the Query: \n%s", filterHiveTablesSQL));
    ArrayList<String> filteredHiveTableIds = new ArrayList<>();
    bigQueryService
        .getQueryResults(filterHiveTablesSQL)
        .iterateAll()
        .forEach(
            row -> {
              filteredHiveTableIds.add(row.get(0).getStringValue());
            });

    log.info(
        String.format(
            "Collected %d Hive Table(s) from Audit Query for further processing",
            filteredHiveTableIds.size()));

    // Alternative way to filter using keyset (less optimal)
    // hiveTableHandlers.keySet().retainAll(filteredHiveTableIds);
    // return hiveTableHandlers;

    return (ConcurrentHashMap<String, HiveTableHandler>)
        filteredHiveTableIds.stream()
            .map(hiveTableHandlers::get)
            .filter(Objects::nonNull)
            .collect(
                Collectors.toConcurrentMap(HiveTableHandler::getHiveTableId, Function.identity()));
  }

  private boolean isAllFiltered() {
    return (configs.hive.filters.dbAllowList == null
        || configs.hive.filters.dbAllowList.size() == 0
        || configs.hive.filters.tableAllowList == null
        || configs.hive.filters.tableAllowList.size() == 0
        || configs.hive.filters.fileFormatDenyList.contains("*")
        || configs.hive.filters.tableDenyList.contains("*")
        || configs.hive.filters.tableTypeDenyList.contains("*"));
  }

  private void logFilterConditions() {
    log.info("Filtering Hive Tables on following deny lists:\n");
    log.info(String.format("DB Allow List: %s", configs.hive.filters.dbAllowList));
    log.info(String.format("FileFormat Deny List: %s", configs.hive.filters.fileFormatDenyList));
    log.info(String.format("TableType Deny List: %s", configs.hive.filters.tableTypeDenyList));
    log.info(String.format("Table Deny List: %s", configs.hive.filters.tableDenyList));
    log.info(String.format("Table Allow List: %s", configs.hive.filters.tableAllowList));
  }
}
