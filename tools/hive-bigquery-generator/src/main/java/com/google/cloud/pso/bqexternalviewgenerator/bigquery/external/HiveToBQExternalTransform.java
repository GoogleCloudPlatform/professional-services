/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery.external;


import com.google.cloud.pso.bqexternalviewgenerator.common.FieldInfo;
import com.google.cloud.pso.bqexternalviewgenerator.common.FieldTraverseAndTransform.FieldTransformer;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveBigQuerySchemaMapping;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveBigQuerySchemaMapping.BigQueryTableType;
import java.util.List;
import java.util.stream.Collectors;

public class HiveToBQExternalTransform implements FieldTransformer {

  @Override
  public String handleStruct(
      FieldInfo field, int structDepth, List<String> fieldSqls, int leftIndent) {

    if (structDepth != 0) {
      return fieldSqls.stream()
          // .map(f -> f.replaceAll("\\s", ":"))
          .collect(Collectors.joining(",", field.quotedName() + " STRUCT<", ">"));
    }

    return fieldSqls.stream().collect(Collectors.joining(",\n"));
  }

  @Override
  public String handleArray(FieldInfo fieldInfo, FieldInfo aliasedField, String elementSql) {

    String fieldNameRemoveSql = elementSql.replaceAll(aliasedField.quotedName() + "\\s*", "");

    return fieldInfo.quotedName() + " ARRAY<" + fieldNameRemoveSql + ">";
  }

  @Override
  public String handlePrimitive(FieldInfo fieldInfo, int structDepth) {
    return String.format(
        "`%s` %s",
        fieldInfo.name,
        HiveBigQuerySchemaMapping.getBQType(fieldInfo.type, BigQueryTableType.EXTERNAL_TABLE));
  }
}
