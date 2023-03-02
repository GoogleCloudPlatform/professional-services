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

import com.google.pso.zetasql.helper.catalog.CatalogWrapper;
import com.google.pso.zetasql.helper.catalog.basic.BasicCatalogWrapper;
import com.google.pso.zetasql.helper.validation.ValidatingVisitor;
import com.google.pso.zetasql.helper.validation.ValidationError;
import com.google.zetasql.Analyzer;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.ParseResumeLocation;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;

public class ZetaSQLHelper {

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
    CatalogUpdaterVisitor catalogUpdaterVisitor = new CatalogUpdaterVisitor(catalog);

    return new Iterator<>() {

      private Optional<ResolvedStatement> previous = Optional.empty();

      private void applyCatalogMutation(ResolvedStatement statement) {
        statement.accept(catalogUpdaterVisitor);
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
