/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery.filter;


import com.google.cloud.pso.bqexternalviewgenerator.bigquery.BigQueryUtil;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties.HiveFilterProperties;
import com.google.common.collect.ImmutableMap;
import java.util.ArrayList;
import java.util.stream.Collectors;
import org.apache.commons.text.StringSubstitutor;

public class BigQueryFilterQueryCreator {

  // Note:  deny list * condition checks are all filtering conditions, so, handled in the
  // ResourceFilterHandler class
  public static String makeFilterHiveTablesSQL(ViewGeneratorProperties configs) {
    StringBuilder filterHiveTableSQLs = new StringBuilder();
    boolean isFirstPredicate = true;
    HiveFilterProperties hiveFilters = configs.hive.filters;

    filterHiveTableSQLs.append(
        String.format(
            "SELECT CONCAT(hivemeta.dbname, \".\", hivemeta.tablename) as hive_table_id\n"
                + "FROM `%s` as hivemeta ",
            BigQueryUtil.getHiveMetastoreStatsTableId(configs)));

    if (hiveFilters.deltaProcessing) {
      // Keeping a 2 hours buffer to offset tool runtime, so that tool doesn't skip any cases which
      // got modified / added
      // between metastore read and bq create
      filterHiveTableSQLs.append(
          StringSubstitutor.replace(
              "\nLEFT JOIN `${bqMetaStoreStatsViewId}` as bqmeta\n"
                  + "       ON ( bqmeta.table_type = \"VIEW\" \n"
                  + "            AND bqmeta.bq_dataset = CONCAT(\"${bqViewDatasetPrefix}\", hivemeta.dbname) \n"
                  + "            AND bqmeta.table_name = hivemeta.tablename ) \n"
                  + "WHERE (hivemeta.table_createtime > DATETIME_SUB(bqmeta.table_create_time, INTERVAL 2 HOUR)\n"
                  + "       OR hivemeta.table_transient_last_ddl_time > DATETIME_SUB(bqmeta.table_create_time, INTERVAL 2 HOUR)\n"
                  + "       OR bqmeta.table_name IS NULL) ",
              ImmutableMap.<String, String>builder()
                  .put("bqMetaStoreStatsViewId", BigQueryUtil.getBQMetastoreStatsViewId(configs))
                  .put("bqViewDatasetPrefix", configs.bigquery.viewDatasetPrefix)
                  .build()));

      // Subsequent predicate filters should have "and" instead of "where"
      isFirstPredicate = false;
    }

    filterHiveTableSQLs.append(
        getHiveMetaFilterPredicates(hiveFilters, "hivemeta", isFirstPredicate));

    return filterHiveTableSQLs.append(";").toString();
  }

  public static String getHiveMetaFilterPredicates(
      HiveFilterProperties hiveFilters, String tableAlias, boolean isFirstPredicate) {

    StringBuilder filterHiveTableSQLs = new StringBuilder();

    if (hiveFilters.dbAllowList.size() > 0 && !hiveFilters.dbAllowList.contains("*")) {
      filterHiveTableSQLs.append(
          StringSubstitutor.replace(
              "\n${predicateCondition} LOWER(${tableAlias}.dbname) IN (${dbAllowListValues})",
              ImmutableMap.<String, String>builder()
                  .put("predicateCondition", isFirstPredicate ? "WHERE" : "AND")
                  .put("tableAlias", tableAlias)
                  .put("dbAllowListValues", getInClauseContent(hiveFilters.dbAllowList))
                  .build()));

      isFirstPredicate = false;
    }

    if (hiveFilters.fileFormatDenyList.size() > 0) {
      filterHiveTableSQLs.append(
          StringSubstitutor.replace(
              "\n${predicateCondition} LOWER(${tableAlias}.serde) NOT IN (${fileFormatDenyListValues})",
              ImmutableMap.<String, String>builder()
                  .put("predicateCondition", isFirstPredicate ? "WHERE" : "AND")
                  .put("tableAlias", tableAlias)
                  .put(
                      "fileFormatDenyListValues",
                      getInClauseContent(hiveFilters.fileFormatDenyList))
                  .build()));

      isFirstPredicate = false;
    }

    if (hiveFilters.tableTypeDenyList.size() > 0) {
      filterHiveTableSQLs.append(
          StringSubstitutor.replace(
              "\n${predicateCondition} LOWER(${tableAlias}.table_type) NOT IN (${tableTypeDenyListValues})",
              ImmutableMap.<String, String>builder()
                  .put("predicateCondition", isFirstPredicate ? "WHERE" : "AND")
                  .put("tableAlias", tableAlias)
                  .put("tableTypeDenyListValues", getInClauseContent(hiveFilters.tableTypeDenyList))
                  .build()));

      isFirstPredicate = false;
    }

    if (hiveFilters.tableDenyList.size() > 0) {
      filterHiveTableSQLs.append(
          StringSubstitutor.replace(
              "\n${predicateCondition} LOWER(CONCAT(${tableAlias}.dbname, \".\", ${tableAlias}.tablename)) NOT IN (${tableDenyListValues})",
              ImmutableMap.<String, String>builder()
                  .put("predicateCondition", isFirstPredicate ? "WHERE" : "AND")
                  .put("tableAlias", tableAlias)
                  .put("tableDenyListValues", getInClauseContent(hiveFilters.tableDenyList))
                  .build()));

      isFirstPredicate = false;
    }

    // add filter condition only if allow list doesn't contain *
    if (hiveFilters.tableAllowList.size() > 0 && !hiveFilters.tableAllowList.contains("*")) {
      filterHiveTableSQLs.append(
          StringSubstitutor.replace(
              "\n${predicateCondition} LOWER(CONCAT(${tableAlias}.dbname, \".\", ${tableAlias}.tablename)) IN (${tableAllowListValues})",
              ImmutableMap.<String, String>builder()
                  .put("predicateCondition", isFirstPredicate ? "WHERE" : "AND")
                  .put("tableAlias", tableAlias)
                  .put("tableAllowListValues", getInClauseContent(hiveFilters.tableAllowList))
                  .build()));

      isFirstPredicate = false;
    }

    return filterHiveTableSQLs.toString();
  }

  // The regex replace ";" and "\s*" with "" is to prevent any sql injection attacks
  private static String getInClauseContent(ArrayList<String> values) {
    return values.stream()
        .map(
            str ->
                String.format("'%s'", str.toLowerCase().replaceAll(";", "").replaceAll("\\s*", "")))
        .collect(Collectors.joining(","));
  }
}
