/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.common;

import static com.google.common.base.Preconditions.checkNotNull;
import static org.apache.commons.lang3.StringUtils.isBlank;

import com.google.cloud.bigquery.StandardSQLTypeName;
import com.google.common.collect.ImmutableList;
import java.util.List;
import java.util.stream.Stream;

public class FieldTraverseAndTransform {

  private final ImmutableList<FieldInfo> tableFields;
  private FieldTransformer fieldTransformer;

  public FieldTraverseAndTransform(List<FieldInfo> tableFields, FieldTransformer fieldTransformer) {
    this.tableFields = ImmutableList.copyOf(tableFields);
    this.fieldTransformer = fieldTransformer;
  }

  public String processSchema() {

    checkNotNull(fieldTransformer, "Field Transformer is Null");

    FieldInfo topField =
        new FieldInfo(
            /*name=*/ "top",
            StandardSQLTypeName.STRUCT.name(),
            /*fullName=*/ "",
            /*repeated=*/ false,
            tableFields);

    return new TransformRunner(fieldTransformer).buildStructSql(topField);
  }

  private Stream<FieldInfo> fieldsNameStream() {
    return tableFields.stream();
  }

  public interface FieldTransformer {

    default int structFormattingIndent() {
      return 0;
    }

    String handleStruct(FieldInfo field, int structDepth, List<String> fieldSqls, int leftIndent);

    String handleArray(FieldInfo fieldInfo, FieldInfo aliasedField, String elementSql);

    String handlePrimitive(FieldInfo fieldInfo, int structDepth);

    default String indentSql(String sql, int indents) {
      if (isBlank(sql)) {
        return sql;
      }
      return CustomUtils.indent(sql, indents).replaceAll("\\n*$", "");
    }
  }
}
