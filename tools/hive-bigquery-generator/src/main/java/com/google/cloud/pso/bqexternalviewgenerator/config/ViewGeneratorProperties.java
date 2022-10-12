/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.config;


import java.util.ArrayList;
import javax.validation.Valid;
import javax.validation.constraints.AssertTrue;
import javax.validation.constraints.Max;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.ConstructorBinding;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "view-generator")
@ConstructorBinding
public class ViewGeneratorProperties {
  public int threadPool;
  @Valid public BigQueryProperties bigquery;
  @Valid public HiveProperties hive;
  @Valid public LogFileProperties logfiles;

  public ViewGeneratorProperties(
      int threadPool,
      BigQueryProperties bigquery,
      HiveProperties hive,
      LogFileProperties logfiles) {
    this.threadPool = threadPool;
    this.bigquery = bigquery;
    this.hive = hive;
    this.logfiles = logfiles;
  }

  @Override
  public String toString() {
    return "ViewGeneratorProperties{"
        + "threadPool="
        + threadPool
        + ", bigquery="
        + bigquery
        + ", hive="
        + hive
        + ", logfiles="
        + logfiles
        + '}';
  }

  @ConstructorBinding
  @Validated
  public static class BigQueryProperties {
    @NotBlank public String location;
    @NotBlank public String project;
    public String serviceAccountKeyFile;

    @Pattern(
        regexp = "^$|[A-Za-z0-9][A-Za-z_0-9]*",
        message =
            "BigQuery Datasets are case sensitive and should contain Letters (uppercase or lowercase), numbers, and underscores.\n"
                + "Datasets Starting with '_' are hidden from explorer. So, do not start with '_' ")
    public String externalTableDatasetPrefix;

    @Pattern(
        regexp = "^$|[A-Za-z0-9][A-Za-z_0-9]*",
        message =
            "BigQuery Datasets are case sensitive and should contain Letters (uppercase or lowercase), numbers, and underscores. \n"
                + "Datasets Starting with '_' are hidden from explorer. So, do not start with '_'")
    public String viewDatasetPrefix;

    @Max(500)
    public int sqlBatchSize;

    public boolean authorizeViewDatasets;

    public boolean requirePartitionFilter;

    public boolean hiveBQSync;

    @Valid public BigQueryAuditProperties audit;

    @AssertTrue(
        message = "External Table BQ Dataset Prefix and View BQ Dataset Prefix must not be same")
    private boolean isDatasetPrefixesNotSame() {
      return !(externalTableDatasetPrefix.equals(viewDatasetPrefix));
    }

    public BigQueryProperties(
        String location,
        String project,
        String serviceAccountKeyFile,
        String externalTableDatasetPrefix,
        String viewDatasetPrefix,
        int sqlBatchSize,
        boolean authorizeViewDatasets,
        boolean requirePartitionFilter,
        boolean hiveBQSync,
        BigQueryAuditProperties audit) {
      this.location = location;
      this.project = project;
      this.serviceAccountKeyFile = serviceAccountKeyFile;
      this.externalTableDatasetPrefix = externalTableDatasetPrefix;
      this.viewDatasetPrefix = viewDatasetPrefix;
      this.sqlBatchSize = sqlBatchSize;
      this.authorizeViewDatasets = authorizeViewDatasets;
      this.requirePartitionFilter = requirePartitionFilter;
      this.hiveBQSync = hiveBQSync;
      this.audit = audit;
    }

    @Override
    public String toString() {
      return "BigQueryProperties{"
          + "location='"
          + location
          + '\''
          + ", project='"
          + project
          + '\''
          + ", serviceAccountKeyFile='"
          + serviceAccountKeyFile
          + '\''
          + ", externalTableDatasetPrefix='"
          + externalTableDatasetPrefix
          + '\''
          + ", viewDatasetPrefix='"
          + viewDatasetPrefix
          + '\''
          + ", sqlBatchSize="
          + sqlBatchSize
          + ", authorizeViewDatasets="
          + authorizeViewDatasets
          + ", requirePartitionFilter="
          + requirePartitionFilter
          + ", hiveBQSync="
          + hiveBQSync
          + ", audit="
          + audit
          + '}';
    }
  }

  @ConstructorBinding
  @Validated
  public static class BigQueryAuditProperties {
    @Pattern(
        regexp = "[A-Za-z0-9][A-Za-z_0-9]*",
        message =
            "BigQuery Datasets are case sensitive and should contain Letters (uppercase or lowercase), numbers, and underscores.\n"
                + "Datasets Starting with '_' are hidden from explorer. So, do not start with '_'")
    public String dataset;

    public String hiveMetastoreStatsTable;
    public String toolExecutionStatsTable;
    public String bigqueryMetastoreStatsTable;
    public int toolStatsTablePartitionExpiryDays;
    public boolean selectViewCheck;

    public BigQueryAuditProperties(
        String dataset,
        String hiveMetastoreStatsTable,
        String toolExecutionStatsTable,
        String bigqueryMetastoreStatsTable,
        int toolStatsTablePartitionExpiryDays,
        boolean selectViewCheck) {
      this.dataset = dataset;
      this.hiveMetastoreStatsTable = hiveMetastoreStatsTable;
      this.toolExecutionStatsTable = toolExecutionStatsTable;
      this.bigqueryMetastoreStatsTable = bigqueryMetastoreStatsTable;
      this.toolStatsTablePartitionExpiryDays = toolStatsTablePartitionExpiryDays;
      this.selectViewCheck = selectViewCheck;
    }

    @Override
    public String toString() {
      return "BigQueryAuditProperties{"
          + "dataset='"
          + dataset
          + '\''
          + ", hiveMetastoreStatsTable='"
          + hiveMetastoreStatsTable
          + '\''
          + ", toolExecutionStatsTable='"
          + toolExecutionStatsTable
          + '\''
          + ", bigqueryMetastoreStatsTable='"
          + bigqueryMetastoreStatsTable
          + '\''
          + ", toolStatsTablePartitionExpiryDays="
          + toolStatsTablePartitionExpiryDays
          + ", selectViewCheck="
          + selectViewCheck
          + '}';
    }
  }

  @Validated
  @ConstructorBinding
  public static class HiveProperties {
    @NotBlank public String thriftUris;
    @Deprecated public int metastoreConnectionPool;
    @NotBlank public String timeZone;
    @Valid public HiveFilterProperties filters;

    public HiveProperties(
        String thriftUris,
        int metastoreConnectionPool,
        String timeZone,
        HiveFilterProperties filters) {
      this.thriftUris = thriftUris;
      this.metastoreConnectionPool = metastoreConnectionPool;
      this.timeZone = timeZone;
      this.filters = filters;
    }

    @Override
    public String toString() {
      return "HiveProperties{"
          + "thriftUris='"
          + thriftUris
          + '\''
          + ", metastoreConnectionPool="
          + metastoreConnectionPool
          + ", timeZone="
          + timeZone
          + ", filters="
          + filters
          + '}';
    }
  }

  @Validated
  @ConstructorBinding
  public static class HiveFilterProperties {

    @Valid
    @NotEmpty(message = "DB AllowList must not be Empty. You can use '*' to process all DBs")
    public ArrayList<
            @Pattern(regexp = "^\\s*\\*\\s*$|^[^.]+$", message = "DB name should not contain dot")
            String>
        dbAllowList;

    @Valid
    @NotEmpty(message = "Table AllowList must not be Empty. You can use '*' to process all Tables")
    public ArrayList<
            @Pattern(
                regexp = "^\\s*\\*\\s*$|^[^.]+\\.[^.]+$",
                message =
                    "Hive Table name should be fully qualified. Expected format: <db-name>.<table-name>")
            String>
        tableAllowList;

    @Valid
    public ArrayList<
            @Pattern(
                regexp = "^\\s*\\*\\s*$|^[^.]+\\.[^.]+$",
                message =
                    "Hive Table name should be fully qualified. Expected format: <db-name>.<table-name>")
            String>
        tableDenyList;

    @Valid
    public ArrayList<
            @Pattern(
                regexp = "^\\s*\\*\\s*$|ORC|AVRO|CSV|JSON|PARQUET",
                flags = Pattern.Flag.CASE_INSENSITIVE)
            String>
        fileFormatDenyList;

    public ArrayList<
            @Pattern(
                regexp = "^\\s*\\*\\s*$|VIRTUAL_VIEW|EXTERNAL_TABLE|MANAGED_TABLE",
                flags = Pattern.Flag.CASE_INSENSITIVE)
            String>
        tableTypeDenyList;

    public Boolean deltaProcessing;

    public HiveFilterProperties(
        ArrayList<String> dbAllowList,
        ArrayList<String> tableAllowList,
        ArrayList<String> tableDenyList,
        ArrayList<String> fileFormatDenyList,
        ArrayList<String> tableTypeDenyList,
        Boolean deltaProcessing) {
      this.dbAllowList = dbAllowList;
      this.tableAllowList = tableAllowList;
      this.tableDenyList = tableDenyList;
      this.fileFormatDenyList = fileFormatDenyList;
      this.tableTypeDenyList = tableTypeDenyList;
      this.deltaProcessing = deltaProcessing;
    }

    @Override
    public String toString() {
      return "HiveFilterProperties{"
          + "dbAllowLists="
          + dbAllowList
          + ", tableAllowLists="
          + tableAllowList
          + ", tableDenyLists="
          + tableDenyList
          + ", fileFormatDenyLists="
          + fileFormatDenyList
          + ", tableTypeDenyLists="
          + tableTypeDenyList
          + ", deltaProcessing="
          + deltaProcessing
          + '}';
    }
  }

  @ConstructorBinding
  @Validated
  public static class LogFileProperties {
    public String outputFolder;
    public String hiveMetastoreStatsFile;
    public String bigqueryExecutionStatsFile;

    public LogFileProperties(
        String outputFolder, String hiveMetastoreStatsFile, String bigqueryExecutionStatsFile) {
      this.outputFolder = outputFolder;
      this.hiveMetastoreStatsFile = hiveMetastoreStatsFile;
      this.bigqueryExecutionStatsFile = bigqueryExecutionStatsFile;
    }

    @Override
    public String toString() {
      return "LogFileProperties{"
          + "outputFolder='"
          + outputFolder
          + '\''
          + ", hiveMetastoreStatsFile='"
          + hiveMetastoreStatsFile
          + '\''
          + ", bigqueryExecutionStatsFile='"
          + bigqueryExecutionStatsFile
          + '\''
          + '}';
    }
  }
}
