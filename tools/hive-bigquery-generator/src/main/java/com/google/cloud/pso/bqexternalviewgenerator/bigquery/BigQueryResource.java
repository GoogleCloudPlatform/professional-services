/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery;


import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

@JsonAutoDetect(fieldVisibility = Visibility.ANY)
@JsonSerialize(using = BigQueryResourceSerializer.class)
public class BigQueryResource {
  String runId;
  String hiveTableId;
  String bigQueryExternalTableId;
  String bigQueryViewId;
  String bigQueryExternalTableDDL;
  String bigQueryViewDDL;
  String bigQuerySelectViewDDL;
  String state;
  String createdAt;

  public BigQueryResource(
      String runId,
      String hiveTableId,
      String bigQueryExternalTableId,
      String bigQueryViewId,
      String bigQueryExternalTableDDL,
      String bigQueryViewDDL,
      String bigQuerySelectViewDDL,
      String state,
      String createdAt) {
    this.runId = runId;
    this.hiveTableId = hiveTableId;
    this.bigQueryExternalTableId = bigQueryExternalTableId;
    this.bigQueryViewId = bigQueryViewId;
    this.bigQueryExternalTableDDL = bigQueryExternalTableDDL;
    this.bigQueryViewDDL = bigQueryViewDDL;
    this.bigQuerySelectViewDDL = bigQuerySelectViewDDL;
    this.state = state;
    this.createdAt = createdAt;
  }

  public String getHiveTableId() {
    return hiveTableId;
  }

  public String getBigQueryExternalTableId() {
    return bigQueryExternalTableId;
  }

  public String getBigQueryViewId() {
    return bigQueryViewId;
  }

  public String getBigQueryExternalTableDDL() {
    return bigQueryExternalTableDDL;
  }

  public String getBigQueryViewDDL() {
    return bigQueryViewDDL;
  }

  public String getBigQuerySelectViewDDL() {
    return bigQuerySelectViewDDL;
  }

  public String getState() {
    return state;
  }

  public void setState(String state) {
    this.state = state;
  }

  public static HiveBigQueryDDLHandlerBuilder builder() {
    return new HiveBigQueryDDLHandlerBuilder();
  }

  public String getRunId() {
    return runId;
  }

  public String getCreatedAt() {
    return createdAt;
  }

  public static final class HiveBigQueryDDLHandlerBuilder {
    String runId;
    String hiveTableId;
    String bigQueryExternalTableId;
    String bigQueryViewId;
    String bigQueryExternalTableDDL;
    String bigQueryViewDDL;
    String bigQuerySelectViewDDL;
    String state;
    String createdAt;

    private HiveBigQueryDDLHandlerBuilder() {}

    public HiveBigQueryDDLHandlerBuilder setHiveTableId(String hiveTableId) {
      this.hiveTableId = hiveTableId;
      return this;
    }

    public HiveBigQueryDDLHandlerBuilder setBigQueryExternalTableId(
        String bigQueryExternalTableId) {
      this.bigQueryExternalTableId = bigQueryExternalTableId;
      return this;
    }

    public HiveBigQueryDDLHandlerBuilder setBigQueryViewId(String bigQueryViewId) {
      this.bigQueryViewId = bigQueryViewId;
      return this;
    }

    public HiveBigQueryDDLHandlerBuilder setBigQueryExternalTableDDL(
        String bigQueryExternalTableDDL) {
      this.bigQueryExternalTableDDL = bigQueryExternalTableDDL;
      return this;
    }

    public HiveBigQueryDDLHandlerBuilder setBigQueryViewDDL(String bigQueryViewDDL) {
      this.bigQueryViewDDL = bigQueryViewDDL;
      return this;
    }

    public HiveBigQueryDDLHandlerBuilder setBigQuerySelectViewDDL(String bigQuerySelectViewDDL) {
      this.bigQuerySelectViewDDL = bigQuerySelectViewDDL;
      return this;
    }

    public HiveBigQueryDDLHandlerBuilder setState(String state) {
      this.state = state;
      return this;
    }

    public HiveBigQueryDDLHandlerBuilder setRunId(String runId) {
      this.runId = runId;
      return this;
    }

    public HiveBigQueryDDLHandlerBuilder setCreatedAt(String createdAt) {
      this.createdAt = createdAt;
      return this;
    }

    public BigQueryResource build() {
      return new BigQueryResource(
          runId,
          hiveTableId,
          bigQueryExternalTableId,
          bigQueryViewId,
          bigQueryExternalTableDDL,
          bigQueryViewDDL,
          bigQuerySelectViewDDL,
          state,
          createdAt);
    }
  }
}
