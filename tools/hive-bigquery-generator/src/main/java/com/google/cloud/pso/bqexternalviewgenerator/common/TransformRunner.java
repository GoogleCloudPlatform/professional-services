/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.common;


import com.google.cloud.bigquery.StandardSQLTypeName;
import com.google.cloud.pso.bqexternalviewgenerator.common.FieldTraverseAndTransform.FieldTransformer;
import com.google.common.collect.ImmutableList;
import java.util.List;
import java.util.stream.Stream;

public class TransformRunner {
  private FieldTransformer fieldTransformer;

  private int aliasFieldCounter;

  public TransformRunner(FieldTransformer fieldTransformer) {
    this.aliasFieldCounter = 0;
    this.fieldTransformer = fieldTransformer;
  }

  public String buildStructSql(FieldInfo field) {
    return buildStructSql(field, 0, 0);
  }

  private String buildStructSql(FieldInfo field, int formattingIndent, int structDepth) {

    int leftIndent = Math.max(formattingIndent, fieldTransformer.structFormattingIndent());

    switch (fieldType(field)) {
      case SIMPLE_STRUCT:
        Stream<FieldInfo> structFieldStream = field.fields.stream();

        List<String> fieldSqls =
            structFieldStream
                .map(subField -> buildStructSql(subField, formattingIndent, structDepth + 1))
                .collect(ImmutableList.toImmutableList());

        return fieldTransformer.handleStruct(field, structDepth, fieldSqls, leftIndent);

      case ARRAY:
      case ARRAY_STRUCT:
        FieldInfo aliasedRepeatedField =
            field.aliasAsTopField("u" + aliasFieldCounter++).withoutRepeat();

        String elementSql =
            buildStructSql(
                aliasedRepeatedField, fieldTransformer.structFormattingIndent(), structDepth + 1);
        return fieldTransformer.handleArray(field, aliasedRepeatedField, elementSql);

      case PRIMITIVE:
        return fieldTransformer.handlePrimitive(field, structDepth);
    }
    return null;
  }

  public FieldType fieldType(FieldInfo field) {
    if (StandardSQLTypeName.STRUCT.name().equals(field.type) && field.repeated) {
      return FieldType.ARRAY_STRUCT;
    } else if (StandardSQLTypeName.STRUCT.name().equals(field.type)) {
      return FieldType.SIMPLE_STRUCT;
    } else if (field.repeated) {
      return FieldType.ARRAY;
    }

    return FieldType.PRIMITIVE;
  }

  public enum FieldType {
    SIMPLE_STRUCT,
    ARRAY_STRUCT,
    ARRAY,
    PRIMITIVE
  }
}
