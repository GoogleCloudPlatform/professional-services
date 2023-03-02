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

package com.google.pso.zetasql.helper;

import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.pso.zetasql.helper.catalog.CatalogWrapper;
import com.google.pso.zetasql.helper.catalog.basic.BasicCatalogWrapper;
import com.google.pso.zetasql.helper.catalog.bigquery.ProcedureInfo;
import com.google.pso.zetasql.helper.catalog.bigquery.TVFInfo;
import com.google.pso.zetasql.helper.validation.ValidatingVisitor;
import com.google.pso.zetasql.helper.validation.ValidationError;
import com.google.zetasql.Analyzer;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.Function;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionProtos.FunctionOptionsProto;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.ParseResumeLocation;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.TVFRelation;
import com.google.zetasql.TVFRelation.Column;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.Mode;
import com.google.zetasql.ZetaSQLFunctions.SignatureArgumentKind;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateFunctionStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateProcedureStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableFunctionStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableStmtBase;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class ZetaSQLHelper {

  private static List<SimpleColumn> extractColumnsFromCreateTableStmt(
      ResolvedCreateTableStmtBase resolvedCreateTableStmtBase) {

    List<String> tableNamePath = resolvedCreateTableStmtBase.getNamePath();
    String tableName = tableNamePath.get(tableNamePath.size() - 1);

    return resolvedCreateTableStmtBase
        .getColumnDefinitionList()
        .stream()
        .map(definition -> new SimpleColumn(
            tableName, definition.getName(), definition.getType()
        ))
        .collect(Collectors.toList());
  }

  private static void registerTableCreation(
      CatalogWrapper catalog,
      ResolvedCreateTableStmtBase createTableStmtBase
  ) {
    List<SimpleColumn> columns = extractColumnsFromCreateTableStmt(createTableStmtBase);
    SimpleTable table = CatalogOperations.buildSimpleTable(
        String.join(".", createTableStmtBase.getNamePath()),
        columns
    );

    CreateMode createMode = createTableStmtBase.getCreateMode();
    CreateScope createScope = createTableStmtBase.getCreateScope();

    catalog.register(table, createMode, createScope);
  }

  private static void registerFunctionCreation(
      CatalogWrapper catalog,
      ResolvedCreateFunctionStmt createFunctionStmt
  ) {
    Function function = new Function(
        createFunctionStmt.getNamePath(),
        "UDF",
        Mode.SCALAR,
        List.of(createFunctionStmt.getSignature())
    );

    CreateMode createMode = createFunctionStmt.getCreateMode();
    CreateScope createScope = createFunctionStmt.getCreateScope();

    catalog.register(function, createMode, createScope);
  }

  private static void registerTVFCreation(
      CatalogWrapper catalog,
      ResolvedCreateTableFunctionStmt createTableFunctionStmt
  ) {
    List<Column> outputSchemaColumns = createTableFunctionStmt
        .getOutputColumnList()
        .stream()
        .map(resolvedOutputColumn -> Column.create(
            resolvedOutputColumn.getName(),
            resolvedOutputColumn.getColumn().getType())
        )
        .collect(Collectors.toList());

    TVFInfo tvfInfo = new TVFInfo(
        createTableFunctionStmt.getNamePath(),
        createTableFunctionStmt.getSignature(),
        TVFRelation.createColumnBased(outputSchemaColumns)
    );

    CreateMode createMode = createTableFunctionStmt.getCreateMode();

    catalog.register(tvfInfo, createMode, CreateScope.CREATE_DEFAULT_SCOPE);
  }

  private static void registerProcedureCreation(
      CatalogWrapper catalog,
      ResolvedCreateProcedureStmt createProcedureStmt
  ) {
    FunctionArgumentType returnType = new FunctionArgumentType(
        TypeFactory.createSimpleType(TypeKind.TYPE_STRING)
    );

    FunctionSignature signature = new FunctionSignature(
        returnType,
        createProcedureStmt.getSignature().getFunctionArgumentList(),
        -1
    );

    ProcedureInfo procedureInfo = new ProcedureInfo(
        createProcedureStmt.getNamePath(),
        signature
    );

    CreateMode createMode = createProcedureStmt.getCreateMode();
    CreateScope createScope = createProcedureStmt.getCreateScope();

    catalog.register(procedureInfo, createMode, createScope);
  }

  public static Iterator<ResolvedStatement> analyzeStatements(
      String query, AnalyzerOptions options
  ) {
    return analyzeStatements(
        query,
        options,
        new BasicCatalogWrapper()
    );
  }

  public static Iterator<ResolvedStatement> analyzeStatements(
      String query, AnalyzerOptions options, SimpleCatalog catalog
  ) {
    return analyzeStatements(
        query,
        options,
        new BasicCatalogWrapper(catalog)
    );
  }

  public static Iterator<ResolvedStatement> analyzeStatements(
      String query,
      AnalyzerOptions options,
      CatalogWrapper catalog
  ) {
    ParseResumeLocation parseResumeLocation = new ParseResumeLocation(query);

    return new Iterator<>() {

      private Optional<ResolvedStatement> previous = Optional.empty();

      private void applyCatalogMutation(ResolvedStatement statement) {
        if(statement instanceof ResolvedCreateTableStmtBase) {
          registerTableCreation(catalog, (ResolvedCreateTableStmtBase) statement);
        } else if (statement instanceof ResolvedCreateFunctionStmt) {
          registerFunctionCreation(catalog, (ResolvedCreateFunctionStmt) statement);
        } else if (statement instanceof ResolvedCreateTableFunctionStmt) {
          registerTVFCreation(catalog, (ResolvedCreateTableFunctionStmt) statement);
        } else if (statement instanceof ResolvedCreateProcedureStmt) {
          registerProcedureCreation(catalog, (ResolvedCreateProcedureStmt) statement);
        }
      }

      @Override
      public boolean hasNext() {
        int inputLength = parseResumeLocation.getInput().getBytes().length;
        int currentPosition = parseResumeLocation.getBytePosition();
        return inputLength > currentPosition;
      }

      @Override
      public ResolvedStatement next() {
        this.previous.ifPresent(this::applyCatalogMutation);

        ResolvedStatement statement = Analyzer.analyzeNextStatement(
            parseResumeLocation,
            options,
            catalog.getZetaSQLCatalog()
        );

        this.previous = Optional.of(statement);

        return statement;
      }
    };

  }

  public static void validateStatement(
      ResolvedStatement statement,
      List<ValidatingVisitor> validations
  ) throws ValidationError {

    for (ValidatingVisitor validation : validations) {
      Optional<ValidationError> maybeError = validation.validate(statement);
      if(maybeError.isPresent()) {
        throw maybeError.get();
      }
    }

  }

  public static void validateStatements(
      Iterator<ResolvedStatement> statementIterator,
      List<ValidatingVisitor> validations
  ) throws ValidationError {

    while(statementIterator.hasNext()) {
      validateStatement(statementIterator.next(), validations);
    }

  }

  private ZetaSQLHelper() {}

}
