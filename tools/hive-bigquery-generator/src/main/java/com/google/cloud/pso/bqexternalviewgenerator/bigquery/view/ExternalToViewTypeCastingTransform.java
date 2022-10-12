/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.bigquery.view;


import com.google.cloud.pso.bqexternalviewgenerator.common.CustomUtils;
import com.google.cloud.pso.bqexternalviewgenerator.common.FieldInfo;
import com.google.cloud.pso.bqexternalviewgenerator.common.FieldTraverseAndTransform.FieldTransformer;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveBigQuerySchemaMapping;
import com.google.cloud.pso.bqexternalviewgenerator.hive.HiveBigQuerySchemaMapping.BigQueryTableType;
import java.util.List;
import java.util.regex.Pattern;

public class ExternalToViewTypeCastingTransform implements FieldTransformer {

  private final Pattern ARRAY_ALIAS_CLEANER =
      Pattern.compile("\\s+AS\\s+[\\w\\.\\`]+$", Pattern.CASE_INSENSITIVE);

  public int structFormattingIndent() {
    return 2;
  }

  @Override
  public String handleStruct(
      FieldInfo structField, int structDepth, List<String> fieldSqls, int leftIndent) {

    String combinedFieldSql = indentSql(String.join(",\n", fieldSqls), leftIndent);

    if (structDepth == 0) {
      return combinedFieldSql;
    }

    return String.format(
        "" + "STRUCT(\n" + "%s\n" + ") AS `%s`", combinedFieldSql, structField.name);
  }

  @Override
  public String handleArray(FieldInfo fieldInfo, FieldInfo aliasedField, String elementSql) {

    if (elementSql.contains("STRUCT") || elementSql.contains("CAST")) {
      String cleanedElementSql = ARRAY_ALIAS_CLEANER.matcher(elementSql).replaceAll("");

      return String.format(
          ""
              + "(\n"
              + "  SELECT\n"
              + "    ARRAY_AGG(\n"
              + "%s\n"
              + "     )\n"
              + "  FROM UNNEST(%s) AS %s\n"
              + ") AS `%s`",
          CustomUtils.indent(cleanedElementSql, 6),
          fieldInfo.fullName,
          aliasedField.name,
          fieldInfo.name);
    }

    return simpleFieldAssignment(fieldInfo);
  }

  @Override
  public String handlePrimitive(FieldInfo field, int sructDepth) {
    String viewDataType = HiveBigQuerySchemaMapping.getBQType(field.type, BigQueryTableType.VIEW);
    String extDataType =
        HiveBigQuerySchemaMapping.getBQType(field.type, BigQueryTableType.EXTERNAL_TABLE);
    if (viewDataType.equalsIgnoreCase(extDataType)) return simpleFieldAssignment(field);

    // return String.format(" CAST(%s AS %s) AS `%s`", field.fullName, viewDataType, field.name);
    if (viewDataType == "DATETIME")
      return String.format(" DATETIME(%s,'UTC') AS `%s`", field.fullName, field.name);

    return String.format(" CAST(%s AS %s) AS `%s`", field.fullName, viewDataType, field.name);
  }

  private String simpleFieldAssignment(FieldInfo field) {
    if (field.fullName.replaceAll("\\`", "").equals(field.name))
      return String.format("`%s`", field.name);

    return String.format("%s AS `%s`", field.fullName, field.name);
  }
}
