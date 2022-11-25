package com.google.pso.zetasql.helper.examples;

import com.google.pso.zetasql.helper.ZetaSQLHelper;
import com.google.pso.zetasql.helper.catalog.bigquery.BigQueryCatalog;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.LanguageOptions;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import java.util.Iterator;

public class B_AnalyzeWithBigQueryCatalog {

  private static AnalyzerOptions getAnalyzerOptions() {
    LanguageOptions languageOptions = new LanguageOptions()
        .enableMaximumLanguageFeatures();
    languageOptions.setSupportsAllStatementKinds();

    AnalyzerOptions analyzerOptions = new AnalyzerOptions();
    analyzerOptions.setLanguageOptions(languageOptions);

    return analyzerOptions;
  }

  public static void main(String[] args) {
    String query =
        "INSERT INTO `bigquery-public-data.samples.wikipedia` (title) VALUES ('random title');\n"
        + "SELECT * FROM `bigquery-public-data.samples.wikipedia` WHERE title = 'random title';";
    AnalyzerOptions options = getAnalyzerOptions();

    BigQueryCatalog catalog = new BigQueryCatalog(
        "bigquery-public-data"
    );

    catalog.addAllTablesFromDataset(
        "bigquery-public-data", "samples"
    );

    Iterator<ResolvedStatement> statementIterator = ZetaSQLHelper.analyzeStatements(
        query, options, catalog
    );

    statementIterator.forEachRemaining(statement -> System.out.println(statement.debugString()));
  }

}
