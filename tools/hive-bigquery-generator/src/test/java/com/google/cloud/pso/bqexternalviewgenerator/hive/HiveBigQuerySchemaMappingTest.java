/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.hive;

import static com.google.common.truth.Truth.assertThat;

import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveBigQuerySchemaMapping.BigQueryTableType;
import com.google.common.collect.ImmutableList;
import org.junit.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;
import org.junit.runners.Parameterized.Parameters;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@RunWith(Parameterized.class)
@ExtendWith(SpringExtension.class)
public class HiveBigQuerySchemaMappingTest {
  private String testName;
  private String testHivePrimitiveType;
  private String expectedBigqueryExternalPrimitiveType;
  private String expectedBigqueryViewPrimitiveType;

  public HiveBigQuerySchemaMappingTest(
      String testName,
      String testHivePrimitiveType,
      String expectedBigqueryExternalPrimitiveType,
      String expectedBigqueryViewPrimitiveType) {
    this.testName = testName;
    this.testHivePrimitiveType = testHivePrimitiveType;
    this.expectedBigqueryExternalPrimitiveType = expectedBigqueryExternalPrimitiveType;
    this.expectedBigqueryViewPrimitiveType = expectedBigqueryViewPrimitiveType;
  }

  @Test
  public void parseHiveSchemaValid() {
    String bqExternalDataType =
        HiveBigQuerySchemaMapping.getBQType(
            testHivePrimitiveType, BigQueryTableType.EXTERNAL_TABLE);

    String bqViewDataType =
        HiveBigQuerySchemaMapping.getBQType(testHivePrimitiveType, BigQueryTableType.VIEW);

    assertThat(bqExternalDataType).isEqualTo(expectedBigqueryExternalPrimitiveType);
    assertThat(bqViewDataType).isEqualTo(expectedBigqueryViewPrimitiveType);
  }

  @Parameters(name = "{0}")
  public static ImmutableList<Object[]> testParameters() {
    return ImmutableList.<Object[]>builder()
        .add(
            new Object[] {
              /*testName=*/ "Int",
              /*testHivePrimitiveType=*/ "int",
              /*expectedBigqueryExternalPrimitiveType=*/ "INT64",
              /*expectedBigqueryViewPrimitiveType=*/ "INT64"
            })
        .add(
            new Object[] {
              /*testName=*/ "timestamp",
              /*testHivePrimitiveType=*/ "timestamp",
              /*expectedBigqueryExternalPrimitiveType=*/ "TIMESTAMP",
              /*expectedBigqueryViewPrimitiveType=*/ "DATETIME"
            })
        .add(
            new Object[] {
              /*testName=*/ "bigint",
              /*testHivePrimitiveType=*/ "bigint",
              /*expectedBigqueryExternalPrimitiveType=*/ "INT64",
              /*expectedBigqueryViewPrimitiveType=*/ "INT64"
            })
        .add(
            new Object[] {
              /*testName=*/ "binary",
              /*testHivePrimitiveType=*/ "binary",
              /*expectedBigqueryExternalPrimitiveType=*/ "BYTES",
              /*expectedBigqueryViewPrimitiveType=*/ "BYTES"
            })
        .add(
            new Object[] {
              /*testName=*/ "decimal",
              /*testHivePrimitiveType=*/ "decimal",
              /*expectedBigqueryExternalPrimitiveType=*/ "NUMERIC",
              /*expectedBigqueryViewPrimitiveType=*/ "NUMERIC"
            })
        .add(
            new Object[] {
              /*testName=*/ "decimal with precision",
              /*testHivePrimitiveType=*/ "decimal(10,2)",
              /*expectedBigqueryExternalPrimitiveType=*/ "NUMERIC",
              /*expectedBigqueryViewPrimitiveType=*/ "NUMERIC"
            })
        .add(
            new Object[] {
              /*testName=*/ "tinyint",
              /*testHivePrimitiveType=*/ "tinyint",
              /*expectedBigqueryExternalPrimitiveType=*/ "INT64",
              /*expectedBigqueryViewPrimitiveType=*/ "INT64"
            })
        .add(
            new Object[] {
              /*testName=*/ "smallint",
              /*testHivePrimitiveType=*/ "smallint",
              /*expectedBigqueryExternalPrimitiveType=*/ "INT64",
              /*expectedBigqueryViewPrimitiveType=*/ "INT64"
            })
        .add(
            new Object[] {
              /*testName=*/ "double",
              /*testHivePrimitiveType=*/ "double",
              /*expectedBigqueryExternalPrimitiveType=*/ "FLOAT64",
              /*expectedBigqueryViewPrimitiveType=*/ "FLOAT64"
            })
        .add(
            new Object[] {
              /*testName=*/ "float",
              /*testHivePrimitiveType=*/ "float",
              /*expectedBigqueryExternalPrimitiveType=*/ "FLOAT64",
              /*expectedBigqueryViewPrimitiveType=*/ "FLOAT64"
            })
        .add(
            new Object[] {
              /*testName=*/ "boolean",
              /*testHivePrimitiveType=*/ "boolean",
              /*expectedBigqueryExternalPrimitiveType=*/ "BOOL",
              /*expectedBigqueryViewPrimitiveType=*/ "BOOL"
            })
        .add(
            new Object[] {
              /*testName=*/ "float",
              /*testHivePrimitiveType=*/ "float",
              /*expectedBigqueryExternalPrimitiveType=*/ "FLOAT64",
              /*expectedBigqueryViewPrimitiveType=*/ "FLOAT64"
            })
        .add(
            new Object[] {
              /*testName=*/ "string",
              /*testHivePrimitiveType=*/ "string",
              /*expectedBigqueryExternalPrimitiveType=*/ "STRING",
              /*expectedBigqueryViewPrimitiveType=*/ "STRING"
            })
        .add(
            new Object[] {
              /*testName=*/ "varchar",
              /*testHivePrimitiveType=*/ "varchar",
              /*expectedBigqueryExternalPrimitiveType=*/ "STRING",
              /*expectedBigqueryViewPrimitiveType=*/ "STRING"
            })
        .add(
            new Object[] {
              /*testName=*/ "varchar with length",
              /*testHivePrimitiveType=*/ "varchar(10)",
              /*expectedBigqueryExternalPrimitiveType=*/ "STRING",
              /*expectedBigqueryViewPrimitiveType=*/ "STRING"
            })
        .add(
            new Object[] {
              /*testName=*/ "char",
              /*testHivePrimitiveType=*/ "char",
              /*expectedBigqueryExternalPrimitiveType=*/ "STRING",
              /*expectedBigqueryViewPrimitiveType=*/ "STRING"
            })
        .add(
            new Object[] {
              /*testName=*/ "char with length",
              /*testHivePrimitiveType=*/ "char(10)",
              /*expectedBigqueryExternalPrimitiveType=*/ "STRING",
              /*expectedBigqueryViewPrimitiveType=*/ "STRING"
            })
        .build();
  }
}
