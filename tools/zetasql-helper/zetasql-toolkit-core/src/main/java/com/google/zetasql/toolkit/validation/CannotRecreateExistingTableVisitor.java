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

package com.google.zetasql.toolkit.validation;

import com.google.common.collect.ImmutableList;
import com.google.zetasql.NotFoundException;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableAsSelectStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableStmtBase;

public class CannotRecreateExistingTableVisitor extends ValidatingVisitor {

  private final SimpleCatalog catalog;

  public CannotRecreateExistingTableVisitor(SimpleCatalog catalog) {
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

    if (!createMode.equals(ResolvedCreateStatementEnums.CreateMode.CREATE_DEFAULT)) {
      return;
    }

    var tableNamePath = createTableStmtBase.getNamePath();

    if (this.catalogHasTable(tableNamePath)) {
      String fullTableName = String.join(".", tableNamePath);
      String errorMessage =
          String.format("Cannot create table '%s': already exists", fullTableName);
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
