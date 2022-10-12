/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery.drop;


import com.google.cloud.pso.bqexternalviewgenerator.bigquery.BigQueryResource;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.BigQueryService;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Log4j2
@Component
public class BigQueryDropResourceHandler {
  @Autowired private BigQueryService bigQueryService;
  @Autowired private ViewGeneratorProperties configs;

  public BigQueryResource deleteBigQueryResources(BigQueryResource bigqueryResource) {
    String deleteExternalTableAndViewSQL = makeDeleteSQLs(bigqueryResource);
    log.info(
        String.format(
            "ROLLBACK: DELETING BigQuery Resources: External TableId: %s, ViewId: %s",
            bigqueryResource.getBigQueryExternalTableId(), bigqueryResource.getBigQueryViewId()));

    String state = bigQueryService.executeSql(deleteExternalTableAndViewSQL, false);

    // setting state of the delete operation with the original state
    bigqueryResource.setState(
        bigqueryResource.getState() + "\n\nROLLBACK: DELETE Table & View Status: " + state);
    return bigqueryResource;
  }

  public String dropOutOfSyncBQResources() throws Exception {
    String outOfSyncBQResourceSQL =
        BigQueryDropResourceSQLCreator.makeOutOfSyncBQResourcesSQL(configs);

    log.info(
        String.format(
            "Syncing Hive and BigQuery based on Query Result : \n%s", outOfSyncBQResourceSQL));

    ArrayList<String> dropResourcesSQLs = new ArrayList<>();
    AtomicInteger counter = new AtomicInteger(0);

    bigQueryService
        .getQueryResults(outOfSyncBQResourceSQL)
        .iterateAll()
        .forEach(
            row -> {
              dropResourcesSQLs.add(
                  row.get(0).getStringValue().equalsIgnoreCase("VIEW")
                      ? BigQueryDropResourceSQLCreator.makeDropViewSQL(row.get(1).getStringValue())
                      : BigQueryDropResourceSQLCreator.makeDropTableSQL(
                          row.get(1).getStringValue()));
              counter.incrementAndGet();
            });

    if (counter.get() > 0) {
      log.info(
          String.format(
              "Found %d out of sync BigQuery Resource(s) to be dropped. Drop SQLs below : %s",
              counter.get(), dropResourcesSQLs));
      return bigQueryService.executeSQLsInBatches(dropResourcesSQLs, configs.bigquery.sqlBatchSize);
    }

    log.info("No Out of Sync BigQuery Resources Found.");
    return null;
  }

  private String makeDeleteSQLs(BigQueryResource bigqueryResource) {
    return String.format(
        "%s\n%s\n",
        BigQueryDropResourceSQLCreator.makeDropTableSQL(
            bigqueryResource.getBigQueryExternalTableId()),
        BigQueryDropResourceSQLCreator.makeDropViewSQL(bigqueryResource.getBigQueryViewId()));
  }
}
