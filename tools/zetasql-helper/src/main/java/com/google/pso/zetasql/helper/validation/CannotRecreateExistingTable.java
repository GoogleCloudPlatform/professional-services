package com.google.pso.zetasql.helper.validation;

import com.google.common.collect.ImmutableList;
import com.google.zetasql.NotFoundException;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableAsSelectStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableStmtBase;

public class CannotRecreateExistingTable extends ValidatingVisitor {

  private final SimpleCatalog catalog;

  public CannotRecreateExistingTable(SimpleCatalog catalog) {
    this.catalog = catalog;
  }

  private boolean catalogHasTable(ImmutableList<String> tableNamePath) {
    try {
      this.catalog.findTable(tableNamePath);
      return true;
    } catch (NotFoundException e) {
      return false;
    }
  }

  private void validateStatement(ResolvedCreateTableStmtBase createTableStmtBase) {
    var createMode = createTableStmtBase.getCreateMode();

    if(!createMode.equals(ResolvedCreateStatementEnums.CreateMode.CREATE_DEFAULT)) {
      return;
    }

    var tableNamePath = createTableStmtBase.getNamePath();

    if(this.catalogHasTable(tableNamePath)) {
      String fullTableName = String.join(".", tableNamePath);
      String errorMessage = String.format(
          "Cannot create table '%s': already exists", fullTableName
      );
      ValidationError error = new ValidationError(errorMessage, createTableStmtBase);
      this.setError(error);
    }
  }

  @Override
  public void visit(ResolvedCreateTableStmt createTableStmt) {
    this.validateStatement(createTableStmt);
  }

  @Override
  public void visit(ResolvedCreateTableAsSelectStmt createTableAsSelectStmt) {
    this.validateStatement(createTableAsSelectStmt);
  }

}
