/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery.drop;


import com.google.cloud.pso.bqexternalviewgenerator.bigquery.BigQueryUtil;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.filter.BigQueryFilterQueryCreator;
import com.google.cloud.pso.bqexternalviewgenerator.common.CustomUtils;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import com.google.common.collect.ImmutableMap;
import org.apache.commons.text.StringSubstitutor;

public class BigQueryDropResourceSQLCreator {

  public static String makeDropTableSQL(String bigQueryTableId) {
    return String.format("DROP TABLE IF EXISTS `%s`;", bigQueryTableId);
  }

  public static String makeDropViewSQL(String bigQueryViewId) {
    return String.format("DROP VIEW IF EXISTS `%s`;", bigQueryViewId);
  }

  // table_type = {"VIEW", "EXTERNAL", "BASE TABLE"}
  public static String makeOutOfSyncBQResourcesSQL(ViewGeneratorProperties configs) {

    StringBuilder hiveMetaSelect = new StringBuilder();
    hiveMetaSelect.append(
        String.format(
            "SELECT *\nFROM `%s` as meta", BigQueryUtil.getHiveMetastoreStatsTableId(configs)));

    hiveMetaSelect.append(
        BigQueryFilterQueryCreator.getHiveMetaFilterPredicates(configs.hive.filters, "meta", true));

    return StringSubstitutor.replace(
        "SELECT bqmeta.table_type, \n"
            + "       CONCAT(bqmeta.bq_project, \".\", bqmeta.bq_dataset, \".\", bqmeta.table_name) as resource_id\n"
            + "FROM `${bqMetaStoreStatsViewId}` as bqmeta\n"
            + "LEFT JOIN ( \n"
            + "${hiveMetaSelect}\n"
            + ") as hivemeta\n"
            + "      ON ( bqmeta.table_type = \"VIEW\" \n"
            + "           AND bqmeta.bq_dataset = CONCAT(\"${bqViewDatasetPrefix}\", hivemeta.dbname) \n"
            + "           AND bqmeta.table_name = hivemeta.tablename ) \n"
            + "         OR ( bqmeta.table_type = \"EXTERNAL\" \n"
            + "              AND bqmeta.bq_dataset = CONCAT(\"${bqExternalDatasetPrefix}\", hivemeta.dbname) \n"
            + "              AND bqmeta.table_name = hivemeta.tablename )\n"
            + "WHERE hivemeta.tablename is NULL;",
        ImmutableMap.<String, String>builder()
            .put("bqMetaStoreStatsViewId", BigQueryUtil.getBQMetastoreStatsViewId(configs))
            .put("bqViewDatasetPrefix", configs.bigquery.viewDatasetPrefix)
            .put("bqExternalDatasetPrefix", configs.bigquery.externalTableDatasetPrefix)
            .put("hiveMetaSelect", CustomUtils.indent(hiveMetaSelect.toString(), 5))
            .build());
  }
}
