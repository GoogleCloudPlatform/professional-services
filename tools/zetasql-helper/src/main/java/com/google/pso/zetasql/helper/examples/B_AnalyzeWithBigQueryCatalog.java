package com.google.pso.zetasql.helper.examples;

import com.google.pso.zetasql.helper.ZetaSQLHelper;
import com.google.pso.zetasql.helper.catalog.bigquery.BigQueryCatalogHelper;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.LanguageOptions;
import com.google.zetasql.NotFoundException;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.Table;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import java.util.Iterator;
import java.util.List;

public class B_AnalyzeWithBigQueryCatalog {

  private static AnalyzerOptions getAnalyzerOptions() {
    LanguageOptions languageOptions = new LanguageOptions()
        .enableMaximumLanguageFeatures();
    languageOptions.setSupportsAllStatementKinds();

    AnalyzerOptions analyzerOptions = new AnalyzerOptions();
    analyzerOptions.setLanguageOptions(languageOptions);

    return analyzerOptions;
  }

  public static void main(String[] args) throws NotFoundException {
    String query =
        "INSERT INTO `bigquery-public-data.samples.wikipedia` (title) VALUES ('random title');\n"
        + "SELECT * FROM `bigquery-public-data.samples.wikipedia` WHERE title = 'random title';";
    AnalyzerOptions options = getAnalyzerOptions();

    BigQueryCatalogHelper catalogHelper = new BigQueryCatalogHelper(
        "bigquery-public-data"
    );
    SimpleCatalog catalog = catalogHelper.createEmptyCatalog("catalog");

    catalogHelper.addAllTablesFromDataset(
        catalog, "bigquery-public-data", "samples"
    );

    Iterator<ResolvedStatement> statementIterator = ZetaSQLHelper.analyzeStatements(
        query, options, catalog,catalogHelper
    );

    statementIterator.forEachRemaining(statement -> System.out.println(statement.debugString()));
  }

}
