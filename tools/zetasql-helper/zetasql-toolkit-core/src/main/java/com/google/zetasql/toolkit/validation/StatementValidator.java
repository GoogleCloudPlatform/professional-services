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

import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import com.google.zetasql.toolkit.ZetaSQLToolkitAnalyzer;
import com.google.zetasql.toolkit.catalog.CatalogWrapper;
import com.google.zetasql.toolkit.usage.UsageTracker;
import com.google.zetasql.toolkit.usage.UsageTrackerImpl;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;

/**
 * Provides utilities for validating ZetaSQL {@link ResolvedStatement}s resulting from running the
 * Analyzer using {@link ValidatingVisitor}s
 */
public class StatementValidator {

  private final UsageTracker usageTracker;

  /** Constructs a StatementValidator */
  public StatementValidator() {
    this(new UsageTrackerImpl());
  }

  /**
   * Constructs a StatementValidator that uses the provided {@link UsageTracker}
   *
   * <p>Package-private, only used internally and for testing.
   *
   * @param usageTracker The UsageTracker used for tracking tool usage
   */
  StatementValidator(UsageTracker usageTracker) {
    this.usageTracker = usageTracker;
  }

  private void validateStatementImpl(
      ResolvedStatement statement, List<ValidatingVisitor> validations) throws ValidationError {

    for (ValidatingVisitor validation : validations) {
      Optional<ValidationError> maybeError = validation.validate(statement);
      if (maybeError.isPresent()) {
        throw maybeError.get();
      }
    }
  }

  /**
   * Applies a set of validations to the provided {@link ResolvedStatement}. Validations are
   * implemented using {@link ValidatingVisitor}s.
   *
   * @param statement The ResolvedStatement to validate
   * @param validations The list of validations tp apply
   * @throws ValidationError if any validations fail
   */
  public void validateStatement(ResolvedStatement statement, List<ValidatingVisitor> validations)
      throws ValidationError {
    this.usageTracker.trackUsage();

    this.validateStatementImpl(statement, validations);
  }

  /**
   * Iterates the provided iterator of {@link ResolvedStatement}s and applied a set of validations
   * to each of them.
   *
   * <p>This method is specially helpful when used in conjunction with {@link
   * ZetaSQLToolkitAnalyzer#analyzeStatements(String, CatalogWrapper)}.
   *
   * @see #validateStatement(ResolvedStatement, List)
   * @param statementIterator The iterator of ResolvedStatements to validate
   * @param validations The list of validations tp apply
   * @throws ValidationError if any validations fail
   */
  public void validateStatements(
      Iterator<ResolvedStatement> statementIterator, List<ValidatingVisitor> validations)
      throws ValidationError {
    this.usageTracker.trackUsage();

    while (statementIterator.hasNext()) {
      this.validateStatementImpl(statementIterator.next(), validations);
    }
  }
}
