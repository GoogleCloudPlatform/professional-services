package com.google.zetasql.toolkit.examples;

import com.google.zetasql.toolkit.ZetaSQLToolkit;
import com.google.zetasql.toolkit.catalog.bigquery.BigQueryCatalog;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.LanguageOptions;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import java.util.Iterator;

/**
 * Example showcasing the types of create statements this toolkit can transparently handle
 * while performing analysis
 */
public class E_AnalyzingCreateStatements {

  private static AnalyzerOptions getAnalyzerOptions() {
    LanguageOptions languageOptions = new LanguageOptions()
        .enableMaximumLanguageFeatures();
    languageOptions.setSupportsAllStatementKinds();

    AnalyzerOptions analyzerOptions = new AnalyzerOptions();
    analyzerOptions.setLanguageOptions(languageOptions);

    return analyzerOptions;
  }

  public static void main(String[] args) {
    String query = "CREATE TEMP TABLE t AS (SELECT 1 AS column UNION ALL SELECT 2 AS column);\n"
        + "CREATE TEMP VIEW v AS (SELECT 2 AS column);\n"
        + "CREATE FUNCTION `dataset.f`(x INT64) AS ((x * 2));\n"
        + "CREATE TABLE FUNCTION `dataset.tvf`(x INT64) AS (SELECT * FROM t WHERE column = x);\n"
        + "SELECT `dataset.f`(a.column) from `dataset.tvf`(2) AS a INNER JOIN v USING (column);"
        + "CREATE PROCEDURE `dataset.procedure_name`()\nBEGIN\n\nEND;\n"
        + "CALL `dataset.procedure_name`();";

    AnalyzerOptions options = getAnalyzerOptions();

    BigQueryCatalog catalog = new BigQueryCatalog("bigquery-public-data");

    Iterator<ResolvedStatement> statementIterator = ZetaSQLToolkit.analyzeStatements(
        query, options, catalog
    );

    statementIterator.forEachRemaining(statement -> System.out.println(statement.debugString()));
  }

}
