package com.google.pso.zetasql.helper.validation;

import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;

public class ValidationError extends Exception {

  private final ResolvedStatement statement;

  public ValidationError(String message, ResolvedStatement statement) {
    super("Validation error: " + message);
    this.statement = statement;
  }

  public ResolvedStatement getStatement() {
    return statement;
  }

}
