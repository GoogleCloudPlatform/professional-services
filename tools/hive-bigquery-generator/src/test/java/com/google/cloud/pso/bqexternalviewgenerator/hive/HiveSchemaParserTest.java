/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.hive;

import static com.google.common.truth.Truth.assertThat;

import com.google.cloud.pso.bqexternalviewgenerator.bigquery.external.HiveToBQExternalTransform;
import com.google.cloud.pso.bqexternalviewgenerator.bigquery.view.ExternalToViewTypeCastingTransform;
import com.google.cloud.pso.bqexternalviewgenerator.common.CustomUtils;
import com.google.cloud.pso.bqexternalviewgenerator.common.FieldInfo;
import com.google.cloud.pso.bqexternalviewgenerator.common.FieldTraverseAndTransform;
import com.google.common.collect.ImmutableList;
import java.util.List;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;
import org.junit.runners.Parameterized.Parameters;

@RunWith(Parameterized.class)
public class HiveSchemaParserTest {
  private String testName;
  private String testHiveSchema;
  private String expectedBigqueryExternalSchema;
  private String expectedBigqueryViewSchema;

  public HiveSchemaParserTest(
      String testName,
      String hiveSchema,
      String expectedBigqueryExternalSchema,
      String expectedBigqueryViewSchema) {
    this.testName = testName;
    this.testHiveSchema = hiveSchema;
    this.expectedBigqueryExternalSchema = expectedBigqueryExternalSchema;
    this.expectedBigqueryViewSchema = expectedBigqueryViewSchema;
  }

  @Test
  public void parseHiveSchemaValid() {
    List<FieldInfo> output = HiveSchemaParser.parseSchema(testHiveSchema);
    String externalSchema =
        CustomUtils.indent(
            new FieldTraverseAndTransform(
                    HiveSchemaParser.parseSchema(testHiveSchema), new HiveToBQExternalTransform())
                .processSchema(),
            2);

    String viewSchema =
        CustomUtils.indent(
            new FieldTraverseAndTransform(
                    HiveSchemaParser.parseSchema(testHiveSchema),
                    new ExternalToViewTypeCastingTransform())
                .processSchema(),
            2);

    assertThat(externalSchema).isEqualTo(expectedBigqueryExternalSchema);
    assertThat(viewSchema).isEqualTo(expectedBigqueryViewSchema);
  }

  @Parameters(name = "{0}")
  public static ImmutableList<Object[]> testParameters() {
    return ImmutableList.<Object[]>builder()
        .add(
            new Object[] {
              /*testName=*/ "All DataTypes Schema",
              /*testHiveSchema=*/ "col1 int,"
                  + "col2 timestamp,"
                  + "col3 bigint,"
                  + "col4 binary,"
                  + "col5 decimal,"
                  + "col6 decimal(10,2),"
                  + "col7 tinyint,"
                  + "col8 smallint,"
                  + "col9 double,"
                  + "col10 float,"
                  + "col11 boolean,"
                  + "col12 string,"
                  + "col13 varchar,"
                  + "col14 varchar(10),"
                  + "col15 char,"
                  + "col16 char(10),"
                  + "col17 STRUCT<ALIAS_COL:array<string>>,"
                  + "col18 struct<col1:struct<a:int>,col2:struct<b:timestamp>>,"
                  + "col19 struct<col1:array<int>,col2:array<int>>,"
                  + "col20 map<date,float>,"
                  + "col21 map<date,timestamp>,"
                  + "col22 map<STRING, array<struct<`value`:STRING, `qualifier`:STRING, `valuewithqualifier`:STRING>>>,"
                  + "col23 map<STRING, struct<`value`:STRING, `qualifier`:STRING, `valuewithqualifier`:STRING>>,"
                  + "col24 array<string>",
              /*expectedBigqueryExternalSchema=*/ "  `col1` INT64,\n"
                  + "  `col2` TIMESTAMP,\n"
                  + "  `col3` INT64,\n"
                  + "  `col4` BYTES,\n"
                  + "  `col5` NUMERIC,\n"
                  + "  `col6` NUMERIC,\n"
                  + "  `col7` INT64,\n"
                  + "  `col8` INT64,\n"
                  + "  `col9` FLOAT64,\n"
                  + "  `col10` FLOAT64,\n"
                  + "  `col11` BOOL,\n"
                  + "  `col12` STRING,\n"
                  + "  `col13` STRING,\n"
                  + "  `col14` STRING,\n"
                  + "  `col15` STRING,\n"
                  + "  `col16` STRING,\n"
                  + "  `col17` STRUCT<`ALIAS_COL` ARRAY<STRING>>,\n"
                  + "  `col18` STRUCT<`col1` STRUCT<`a` INT64>,`col2` STRUCT<`b` TIMESTAMP>>,\n"
                  + "  `col19` STRUCT<`col1` ARRAY<INT64>,`col2` ARRAY<INT64>>,\n"
                  + "  `col20` ARRAY<STRUCT<`key` DATE,`value` FLOAT64>>,\n"
                  + "  `col21` ARRAY<STRUCT<`key` DATE,`value` TIMESTAMP>>,\n"
                  + "  `col22` ARRAY<STRUCT<`key` STRING,`value` ARRAY<STRUCT<`VALUE` STRING,`QUALIFIER` STRING,`VALUEWITHQUALIFIER` STRING>>>>,\n"
                  + "  `col23` ARRAY<STRUCT<`key` STRING,`value` STRUCT<`VALUE` STRING,`QUALIFIER` STRING,`VALUEWITHQUALIFIER` STRING>>>,\n"
                  + "  `col24` ARRAY<STRING>",
              /*expectedBigqueryViewSchema=*/ "    `col1`,\n"
                  + "     DATETIME(`col2`,'UTC') AS `col2`,\n"
                  + "    `col3`,\n"
                  + "    `col4`,\n"
                  + "    `col5`,\n"
                  + "    `col6`,\n"
                  + "    `col7`,\n"
                  + "    `col8`,\n"
                  + "    `col9`,\n"
                  + "    `col10`,\n"
                  + "    `col11`,\n"
                  + "    `col12`,\n"
                  + "    `col13`,\n"
                  + "    `col14`,\n"
                  + "    `col15`,\n"
                  + "    `col16`,\n"
                  + "    STRUCT(\n"
                  + "      `col17`.`ALIAS_COL` AS `ALIAS_COL`\n"
                  + "    ) AS `col17`,\n"
                  + "    STRUCT(\n"
                  + "      STRUCT(\n"
                  + "        `col18`.`col1`.`a` AS `a`\n"
                  + "      ) AS `col1`,\n"
                  + "      STRUCT(\n"
                  + "         DATETIME(`col18`.`col2`.`b`,'UTC') AS `b`\n"
                  + "      ) AS `col2`\n"
                  + "    ) AS `col18`,\n"
                  + "    STRUCT(\n"
                  + "      `col19`.`col1` AS `col1`,\n"
                  + "      `col19`.`col2` AS `col2`\n"
                  + "    ) AS `col19`,\n"
                  + "    (\n"
                  + "      SELECT\n"
                  + "        ARRAY_AGG(\n"
                  + "          STRUCT(\n"
                  + "            `u3`.`key` AS `key`,\n"
                  + "            `u3`.`value` AS `value`\n"
                  + "          )\n"
                  + "         )\n"
                  + "      FROM UNNEST(`col20`) AS u3\n"
                  + "    ) AS `col20`,\n"
                  + "    (\n"
                  + "      SELECT\n"
                  + "        ARRAY_AGG(\n"
                  + "          STRUCT(\n"
                  + "            `u4`.`key` AS `key`,\n"
                  + "             DATETIME(`u4`.`value`,'UTC') AS `value`\n"
                  + "          )\n"
                  + "         )\n"
                  + "      FROM UNNEST(`col21`) AS u4\n"
                  + "    ) AS `col21`,\n"
                  + "    (\n"
                  + "      SELECT\n"
                  + "        ARRAY_AGG(\n"
                  + "          STRUCT(\n"
                  + "            `u5`.`key` AS `key`,\n"
                  + "            (\n"
                  + "              SELECT\n"
                  + "                ARRAY_AGG(\n"
                  + "                  STRUCT(\n"
                  + "                    `u6`.`VALUE` AS `VALUE`,\n"
                  + "                    `u6`.`QUALIFIER` AS `QUALIFIER`,\n"
                  + "                    `u6`.`VALUEWITHQUALIFIER` AS `VALUEWITHQUALIFIER`\n"
                  + "                  )\n"
                  + "                 )\n"
                  + "              FROM UNNEST(`u5`.`value`) AS u6\n"
                  + "            ) AS `value`\n"
                  + "          )\n"
                  + "         )\n"
                  + "      FROM UNNEST(`col22`) AS u5\n"
                  + "    ) AS `col22`,\n"
                  + "    (\n"
                  + "      SELECT\n"
                  + "        ARRAY_AGG(\n"
                  + "          STRUCT(\n"
                  + "            `u7`.`key` AS `key`,\n"
                  + "            STRUCT(\n"
                  + "              `u7`.`value`.`VALUE` AS `VALUE`,\n"
                  + "              `u7`.`value`.`QUALIFIER` AS `QUALIFIER`,\n"
                  + "              `u7`.`value`.`VALUEWITHQUALIFIER` AS `VALUEWITHQUALIFIER`\n"
                  + "            ) AS `value`\n"
                  + "          )\n"
                  + "         )\n"
                  + "      FROM UNNEST(`col23`) AS u7\n"
                  + "    ) AS `col23`,\n"
                  + "    `col24`"
            })
        .add(
            new Object[] {
              /*testName=*/ "Complex Map with Array Schema",
              /*testHiveSchema=*/ "Supercategoryobj array<struct<super_category:string,weights:map<string,string>>>,",
              /*expectedBigqueryExternalSchema=*/ "  `Supercategoryobj` ARRAY<STRUCT<`super_category` STRING,`weights` ARRAY<STRUCT<`key` STRING,`value` STRING>>>>",
              /*expectedBigqueryViewSchema=*/ "    (\n"
                  + "      SELECT\n"
                  + "        ARRAY_AGG(\n"
                  + "          STRUCT(\n"
                  + "            `u0`.`super_category` AS `super_category`,\n"
                  + "            (\n"
                  + "              SELECT\n"
                  + "                ARRAY_AGG(\n"
                  + "                  STRUCT(\n"
                  + "                    `u1`.`key` AS `key`,\n"
                  + "                    `u1`.`value` AS `value`\n"
                  + "                  )\n"
                  + "                 )\n"
                  + "              FROM UNNEST(`u0`.`weights`) AS u1\n"
                  + "            ) AS `weights`\n"
                  + "          )\n"
                  + "         )\n"
                  + "      FROM UNNEST(`Supercategoryobj`) AS u0\n"
                  + "    ) AS `Supercategoryobj`"
            })
        .add(
            new Object[] {
              /*testName=*/ "Map With Timestamp Schema",
              /*testHiveSchema=*/ "Invalid_clicks:map<decimal(21,2),map<int,map<decimal,struct<a int, b timestamp>>>>",
              /*expectedBigqueryExternalSchema=*/ "  `Invalid_clicks` ARRAY<STRUCT<`key` NUMERIC,`value` ARRAY<STRUCT<`key` INT64,`value` ARRAY<STRUCT<`key` NUMERIC,`value` STRUCT<`A` INT64,`B` TIMESTAMP>>>>>>>",
              /*expectedBigqueryViewSchema=*/ "    (\n"
                  + "      SELECT\n"
                  + "        ARRAY_AGG(\n"
                  + "          STRUCT(\n"
                  + "            `u0`.`key` AS `key`,\n"
                  + "            (\n"
                  + "              SELECT\n"
                  + "                ARRAY_AGG(\n"
                  + "                  STRUCT(\n"
                  + "                    `u1`.`key` AS `key`,\n"
                  + "                    (\n"
                  + "                      SELECT\n"
                  + "                        ARRAY_AGG(\n"
                  + "                          STRUCT(\n"
                  + "                            `u2`.`key` AS `key`,\n"
                  + "                            STRUCT(\n"
                  + "                              `u2`.`value`.`A` AS `A`,\n"
                  + "                               DATETIME(`u2`.`value`.`B`,'UTC') AS `B`\n"
                  + "                            ) AS `value`\n"
                  + "                          )\n"
                  + "                         )\n"
                  + "                      FROM UNNEST(`u1`.`value`) AS u2\n"
                  + "                    ) AS `value`\n"
                  + "                  )\n"
                  + "                 )\n"
                  + "              FROM UNNEST(`u0`.`value`) AS u1\n"
                  + "            ) AS `value`\n"
                  + "          )\n"
                  + "         )\n"
                  + "      FROM UNNEST(`Invalid_clicks`) AS u0\n"
                  + "    ) AS `Invalid_clicks`"
            })
        .build();
  }
}
