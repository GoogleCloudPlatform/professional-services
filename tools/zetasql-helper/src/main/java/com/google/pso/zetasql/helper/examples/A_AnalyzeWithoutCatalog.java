package com.google.pso.zetasql.helper.examples;

import com.google.pso.zetasql.helper.ZetaSQLHelper;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.LanguageOptions;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import java.util.Iterator;

public class A_AnalyzeWithoutCatalog {

  private static AnalyzerOptions getAnalyzerOptions() {
    LanguageOptions languageOptions = new LanguageOptions()
        .enableMaximumLanguageFeatures();
    languageOptions.setSupportsAllStatementKinds();

    AnalyzerOptions analyzerOptions = new AnalyzerOptions();
    analyzerOptions.setLanguageOptions(languageOptions);

    return analyzerOptions;
  }

  public static void main(String[] args) {
    String query = "CREATE TEMP TABLE t AS (SELECT 1 AS column);\n"
        + "SELECT column from t;";
    AnalyzerOptions options = getAnalyzerOptions();

    Iterator<ResolvedStatement> statementIterator = ZetaSQLHelper.analyzeStatements(
        query, options
    );

    statementIterator.forEachRemaining(statement -> System.out.println(statement.debugString()));
  }

}
