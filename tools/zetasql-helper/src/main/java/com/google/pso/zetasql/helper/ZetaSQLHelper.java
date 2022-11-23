package com.google.pso.zetasql.helper;

import com.google.pso.zetasql.helper.catalog.CatalogHelper;
import com.google.pso.zetasql.helper.catalog.CatalogOperations;
import com.google.pso.zetasql.helper.validation.ValidatingVisitor;
import com.google.pso.zetasql.helper.validation.ValidationError;
import com.google.zetasql.Analyzer;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.ParseResumeLocation;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateFunctionStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableStmtBase;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class ZetaSQLHelper {

  // Catalog helper that can register tables (e.g. for processing a CreateTableStmt),
  // but not fetch tables otherwise.
  // Used for ZetaSQLHelper.analyzeStatements when no catalog or helper is provided.
  private static class SimpleCatalogHelper extends CatalogHelper {
    // TODO: Revise if this class should be here or event exist at all

    @Override
    public void registerTable(SimpleCatalog catalog, SimpleTable table, boolean isTemp) {
      CatalogOperations.createTableInCatalog(
          catalog,
          List.of(List.of(table.getFullName())),
          table.getColumnList()
      );
    }

    @Override
    public void addTables(SimpleCatalog catalog, List<List<String>> tablePaths) {
      throw new UnsupportedOperationException("SimpleCatalogHelper cannot fetch tables");
    }
  }

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
      SimpleCatalog catalog,
      CatalogHelper catalogHelper,
      ResolvedCreateTableStmtBase createTableStmtBase
  ) {
    // TODO: should validate if the table already exists and fail
    //  or replace it accordingly.
    List<SimpleColumn> columns = extractColumnsFromCreateTableStmt(createTableStmtBase);
    SimpleTable table = catalogHelper.buildSimpleTable(
        createTableStmtBase.getNamePath(),
        columns
    );

    CreateScope createScope = createTableStmtBase.getCreateScope();
    boolean isTemp = createScope.equals(CreateScope.CREATE_TEMP);

    catalogHelper.registerTable(catalog, table, isTemp);
  }

  private  static void registerFunctionCreation(
      SimpleCatalog catalog,
      ResolvedCreateFunctionStmt createFunctionStmt
  ) {
    throw new UnsupportedOperationException("Unimplemented");
  }

  public static Iterator<ResolvedStatement> analyzeStatements(
      String query, AnalyzerOptions options
  ) {
    return analyzeStatements(
        query,
        options,
        new SimpleCatalog("catalog"),
        new SimpleCatalogHelper()
    );
  }

  public static Iterator<ResolvedStatement> analyzeStatements(
      String query,
      AnalyzerOptions options,
      SimpleCatalog catalog,
      CatalogHelper catalogHelper
  ) {
    ParseResumeLocation parseResumeLocation = new ParseResumeLocation(query);

    return new Iterator<>() {

      private Optional<ResolvedStatement> previous = Optional.empty();

      private void applyCatalogMutation(ResolvedStatement statement) {
        if(statement instanceof ResolvedCreateTableStmtBase) {
          ZetaSQLHelper.registerTableCreation(
              catalog, catalogHelper, (ResolvedCreateTableStmtBase) statement
          );
        } else if (statement instanceof ResolvedCreateFunctionStmt) {
          ZetaSQLHelper.registerFunctionCreation(catalog, (ResolvedCreateFunctionStmt) statement);
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
            catalog
        );

        this.previous = Optional.of(statement);

        return statement;
      }
    };

  }

  private static void validateStatement(
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
