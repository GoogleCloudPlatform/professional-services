package com.google.zetasql.toolkit.validation;

import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import com.google.zetasql.resolvedast.ResolvedNodes.Visitor;
import java.util.Optional;

public abstract class ValidatingVisitor extends Visitor {

  private Optional<ValidationError> error = Optional.empty();

  public void setError(ValidationError error) {
    this.error = Optional.of(error);
  }

  public Optional<ValidationError> validate(ResolvedStatement statement) {
    statement.accept(this);
    return this.error;
  }

}
