/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery;


import com.google.cloud.bigquery.DatasetId;
import com.google.cloud.pso.bqexternalviewgenerator.audit.AuditService;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.dataset.BigQueryDatasetHandler;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.drop.BigQueryDropResourceHandler;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.external.BigQueryExternalTableDDLCreator;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.select.BigQuerySelectViewQueryCreator;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.view.BigQueryViewDDLCreator;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveTableHandler;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Map;
import java.util.TimeZone;
import lombok.extern.log4j.Log4j2;
import org.apache.commons.lang.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Log4j2
@Component
public class BigQueryResourceCreator {
  @Autowired private BigQueryService bigQueryService;
  @Autowired private AuditService auditService;
  @Autowired private BigQueryDropResourceHandler bigQueryDropResourceHandler;
  @Autowired private ViewGeneratorProperties configs;
  private static String runId;
  private static SimpleDateFormat sdfCreatedAt;

  private void initRunId() {
    SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd_HHmmss");
    sdf.setTimeZone(TimeZone.getTimeZone(configs.hive.timeZone));
    runId = String.format("run_%s", sdf.format(new java.util.Date()));

    sdfCreatedAt = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    sdfCreatedAt.setTimeZone(TimeZone.getTimeZone(configs.hive.timeZone));
  }

  public String generateAllBQDatasets(ArrayList<String> hiveDBs) {
    initRunId();
    BigQueryDatasetHandler bigqueryDatasetHandler = new BigQueryDatasetHandler(hiveDBs, configs);
    String createDatasetDDL = bigqueryDatasetHandler.makeCreateDDLs();
    log.debug(String.format("Dataset Generator BQ Query: \n%s", createDatasetDDL));
    return bigQueryService.executeSql(createDatasetDDL, false);
  }

  public void generateBigqueryResources(HiveTableHandler hiveTableHandler) throws Exception {
    try {
      BigQueryResource bigqueryResource = getBQResource(hiveTableHandler);
      String tableDDLsPerHiveTable = makeDDL(bigqueryResource);
      String state = bigQueryService.executeSql(tableDDLsPerHiveTable, false);
      bigqueryResource.setState(state);

      // This is a rollback step initiated If bq resource creation failed, then delete the resource
      // if anyone got created
      // This can be modified when bigquery transactions are GA, that way, the sqls can be wrapped
      // in
      // a bigquery transaction and this step would no more be required.
      if (!state.equals(BigQueryService.SUCCESS_STATE))
        bigqueryResource = bigQueryDropResourceHandler.deleteBigQueryResources(bigqueryResource);

      auditService.storeBQResource(bigqueryResource);

    } catch (Exception e) {
      log.error("BQ Resource Generation Error", e);
      auditService.storeBQResource(
          BigQueryResource.builder()
              .setHiveTableId(hiveTableHandler.getHiveTableId())
              .setState("TOOL ERROR: " + ExceptionUtils.getFullStackTrace(e))
              .build());
    }
  }

  // Creates all BigQuery DDLs - External Table, View, Select View
  private BigQueryResource getBQResource(HiveTableHandler hiveTableHandler) {
    return BigQueryResource.builder()
        .setRunId(runId)
        .setHiveTableId(hiveTableHandler.getHiveTable().getHiveTableId())
        .setBigQueryExternalTableId(hiveTableHandler.getBQExternalTableId())
        .setBigQueryExternalTableDDL(
            BigQueryExternalTableDDLCreator.makeDDL(hiveTableHandler, configs))
        .setBigQueryViewId(hiveTableHandler.getBQViewId())
        .setBigQueryViewDDL(BigQueryViewDDLCreator.makeDDL(hiveTableHandler))
        .setBigQuerySelectViewDDL(BigQuerySelectViewQueryCreator.makeDDL(hiveTableHandler, configs))
        .setCreatedAt(sdfCreatedAt.format(new java.util.Date()))
        .build();
  }

  private String makeDDL(BigQueryResource bigqueryResource) {
    StringBuilder query = new StringBuilder();
    query.append(bigqueryResource.getBigQueryExternalTableDDL() + "\n\n");
    query.append(bigqueryResource.getBigQueryViewDDL() + "\n\n");
    if (configs.bigquery.audit.selectViewCheck == true)
      query.append(bigqueryResource.getBigQuerySelectViewDDL() + "\n\n");

    return query.toString();
  }

  public void closeAudit() {
    auditService.closeBQResourceWriter();
  }

  public Map<DatasetId, DatasetId> getSourceTargetDatasetIdList(ArrayList<String> hiveDBs) {
    BigQueryDatasetHandler bigqueryDatasetHandler = new BigQueryDatasetHandler(hiveDBs, configs);
    return bigqueryDatasetHandler.getSourceTargetDatasetIdList();
  }
}
