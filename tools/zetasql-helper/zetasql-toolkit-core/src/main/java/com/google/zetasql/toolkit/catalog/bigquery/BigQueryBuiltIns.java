/*
 * Copyright 2023 Google LLC All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.zetasql.toolkit.catalog.bigquery;

import com.google.common.collect.ImmutableList;
import com.google.zetasql.Function;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionArgumentType.FunctionArgumentTypeOptions;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.Type;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.ArgumentCardinality;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.Mode;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.NamedArgumentKind;
import com.google.zetasql.ZetaSQLFunctions.SignatureArgumentKind;
import com.google.zetasql.ZetaSQLType;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.toolkit.catalog.CatalogOperations;
import java.util.List;
import java.util.Map;

/**
 * Defines types, functions and procedures which are available in BigQuery but are not built into
 * ZetaSQL.
 *
 * @see #addToCatalog(SimpleCatalog) to add these resources to a {@link SimpleCatalog}.
 */
class BigQueryBuiltIns {

  public static final Map<String, Type> TYPE_ALIASES =
      Map.of(
          "INT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
          "SMALLINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
          "INTEGER", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
          "BIGINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
          "TINYINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
          "BYTEINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64),
          "DECIMAL", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_NUMERIC),
          "BIGDECIMAL", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_BIGNUMERIC));

  private static final String BIGQUERY_FUNCTION_GROUP = "BigQuery";

  public static final List<Function> FUNCTIONS =
      List.of(
          // CONTAINS_SUBSTR(STRING, ANY, [STRING]) -> BOOL
          new Function(
              "CONTAINS_SUBSTR",
              BIGQUERY_FUNCTION_GROUP,
              Mode.SCALAR,
              List.of(
                  new FunctionSignature(
                      new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_BOOL)),
                      List.of(
                          new FunctionArgumentType(
                              TypeFactory.createSimpleType(TypeKind.TYPE_STRING),
                              FunctionArgumentTypeOptions.builder()
                                  .setArgumentName("expression", NamedArgumentKind.POSITIONAL_ONLY)
                                  .build(),
                              1),
                          new FunctionArgumentType(
                              SignatureArgumentKind.ARG_TYPE_ANY_1,
                              FunctionArgumentTypeOptions.builder()
                                  .setArgumentName(
                                      "search_value_literal", NamedArgumentKind.POSITIONAL_ONLY)
                                  .build(),
                              1),
                          new FunctionArgumentType(
                              TypeFactory.createSimpleType(TypeKind.TYPE_STRING),
                              FunctionArgumentTypeOptions.builder()
                                  .setArgumentName("json_scope", NamedArgumentKind.POSITIONAL_ONLY)
                                  .setCardinality(ArgumentCardinality.OPTIONAL)
                                  .build(),
                              1)),
                      -1))),
          // SEARCH(ANY, STRING, [STRING], [STRING]) -> BOOL
          new Function(
              "SEARCH",
              BIGQUERY_FUNCTION_GROUP,
              Mode.SCALAR,
              List.of(
                  new FunctionSignature(
                      new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_BOOL)),
                      List.of(
                          new FunctionArgumentType(
                              SignatureArgumentKind.ARG_TYPE_ANY_1,
                              FunctionArgumentTypeOptions.builder()
                                  .setArgumentName("search_data", NamedArgumentKind.POSITIONAL_ONLY)
                                  .build(),
                              1),
                          new FunctionArgumentType(
                              TypeFactory.createSimpleType(TypeKind.TYPE_STRING),
                              FunctionArgumentTypeOptions.builder()
                                  .setArgumentName(
                                      "search_query", NamedArgumentKind.POSITIONAL_ONLY)
                                  .build(),
                              1),
                          new FunctionArgumentType(
                              TypeFactory.createSimpleType(TypeKind.TYPE_STRING),
                              FunctionArgumentTypeOptions.builder()
                                  .setArgumentName("json_scope", NamedArgumentKind.POSITIONAL_ONLY)
                                  .setCardinality(ArgumentCardinality.OPTIONAL)
                                  .build(),
                              1),
                          new FunctionArgumentType(
                              TypeFactory.createSimpleType(TypeKind.TYPE_STRING),
                              FunctionArgumentTypeOptions.builder()
                                  .setArgumentName("analyzer", NamedArgumentKind.POSITIONAL_ONLY)
                                  .setCardinality(ArgumentCardinality.OPTIONAL)
                                  .build(),
                              1)),
                      -1))));

  public static final List<ProcedureInfo> PROCEDURES =
      List.of(
          // BQ.ABORT_SESSION([STRING])
          new ProcedureInfo(
              ImmutableList.of("BQ", "ABORT_SESSION"),
              new FunctionSignature(
                  new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING)),
                  List.of(
                      new FunctionArgumentType(
                          TypeFactory.createSimpleType(TypeKind.TYPE_STRING),
                          FunctionArgumentTypeOptions.builder()
                              .setArgumentName("session_id", NamedArgumentKind.POSITIONAL_ONLY)
                              .setCardinality(ArgumentCardinality.OPTIONAL)
                              .build(),
                          1)),
                  -1)),
          // BQ.JOBS.CANCEL(STRING)
          new ProcedureInfo(
              ImmutableList.of("BQ", "JOBS", "CANCEL"),
              new FunctionSignature(
                  new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING)),
                  List.of(
                      new FunctionArgumentType(
                          TypeFactory.createSimpleType(TypeKind.TYPE_STRING),
                          FunctionArgumentTypeOptions.builder()
                              .setArgumentName("job", NamedArgumentKind.POSITIONAL_ONLY)
                              .setCardinality(ArgumentCardinality.REQUIRED)
                              .build(),
                          1)),
                  -1)),
          // BQ.REFRESH_EXTERNAL_METADATA_CACHE(STRING)
          new ProcedureInfo(
              ImmutableList.of("BQ", "REFRESH_EXTERNAL_METADATA_CACHE"),
              new FunctionSignature(
                  new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING)),
                  List.of(
                      new FunctionArgumentType(
                          TypeFactory.createSimpleType(TypeKind.TYPE_STRING),
                          FunctionArgumentTypeOptions.builder()
                              .setArgumentName("table_name", NamedArgumentKind.POSITIONAL_ONLY)
                              .setCardinality(ArgumentCardinality.REQUIRED)
                              .build(),
                          1)),
                  -1)),
          // BQ.REFRESH_MATERIALIZED_VIEW(STRING)
          new ProcedureInfo(
              ImmutableList.of("BQ", "REFRESH_MATERIALIZED_VIEW"),
              new FunctionSignature(
                  new FunctionArgumentType(TypeFactory.createSimpleType(TypeKind.TYPE_STRING)),
                  List.of(
                      new FunctionArgumentType(
                          TypeFactory.createSimpleType(TypeKind.TYPE_STRING),
                          FunctionArgumentTypeOptions.builder()
                              .setArgumentName("view_name", NamedArgumentKind.POSITIONAL_ONLY)
                              .setCardinality(ArgumentCardinality.REQUIRED)
                              .build(),
                          1)),
                  -1)));

  /**
   * Adds the defined BigQuery-specific types, functions and procedures to the provided {@link
   * SimpleCatalog}
   *
   * @param catalog The SimpleCatalog to which resources should be added
   */
  public static void addToCatalog(SimpleCatalog catalog) {
    TYPE_ALIASES.forEach(catalog::addType);
    FUNCTIONS.forEach(catalog::addFunction);

    for (ProcedureInfo procedureInfo : PROCEDURES) {
      List<String> namePath = procedureInfo.getNamePath();
      String procedureName = namePath.get(namePath.size() - 1);
      List<List<String>> procedurePaths =
          List.of(namePath, List.of(procedureName), List.of(String.join(".", namePath)));
      CatalogOperations.createProcedureInCatalog(
          catalog, procedurePaths, procedureInfo, CreateMode.CREATE_OR_REPLACE);
    }
  }

  private BigQueryBuiltIns() {}
}
