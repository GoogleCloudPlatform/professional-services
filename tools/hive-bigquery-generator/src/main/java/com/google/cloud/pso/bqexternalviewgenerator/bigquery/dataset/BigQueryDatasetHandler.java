/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery.dataset;


import com.google.cloud.bigquery.DatasetId;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.BigQueryUtil;
import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public class BigQueryDatasetHandler {
  public ArrayList<String> hiveDBs;

  ViewGeneratorProperties configs;

  public BigQueryDatasetHandler(ArrayList<String> hiveDBs, ViewGeneratorProperties configs) {
    this.hiveDBs = hiveDBs;
    this.configs = configs;
  }

  private ArrayList<String> getBQDatasetNames(boolean withAuditDataset) {
    List<String> bqExternalDatasetIds =
        Optional.ofNullable(hiveDBs).orElse(new ArrayList<String>()).stream()
            .map(
                hiveDB ->
                    BigQueryUtil.fullDatasetId(
                        configs.bigquery.project,
                        configs.bigquery.externalTableDatasetPrefix + hiveDB))
            .collect(Collectors.toList());

    List<String> bqViewDatasetIds =
        Optional.ofNullable(hiveDBs).orElse(new ArrayList<String>()).stream()
            .map(
                hiveDB ->
                    BigQueryUtil.fullDatasetId(
                        configs.bigquery.project, configs.bigquery.viewDatasetPrefix + hiveDB))
            .collect(Collectors.toList());

    String auditDatasetId =
        BigQueryUtil.fullDatasetId(configs.bigquery.project, configs.bigquery.audit.dataset);

    // Add all the datasets to be created
    bqExternalDatasetIds.addAll(bqViewDatasetIds);

    if (withAuditDataset == true) bqExternalDatasetIds.add(auditDatasetId);

    return (ArrayList<String>) bqExternalDatasetIds;
  }

  public String makeCreateDDLs() {
    return BigQueryDatasetDDLCreator.makeCreateDDLs(getBQDatasetNames(true));
  }

  public String makeBQMetastoreViewDDL(String targetViewName) {
    return BigQueryDatasetDDLCreator.makeBQMetastoreViewDDL(
        getBQDatasetNames(false), targetViewName, configs.hive.timeZone);
  }

  public Map<DatasetId, DatasetId> getSourceTargetDatasetIdList() {
    Map<DatasetId, DatasetId> result = new HashMap<>();

    Optional.ofNullable(hiveDBs).orElse(new ArrayList<String>()).stream()
        .forEach(
            hiveDB ->
                result.put(
                    DatasetId.of(
                        configs.bigquery.project,
                        configs.bigquery.externalTableDatasetPrefix + hiveDB),
                    DatasetId.of(
                        configs.bigquery.project, configs.bigquery.viewDatasetPrefix + hiveDB)));

    return result;
  }
}
