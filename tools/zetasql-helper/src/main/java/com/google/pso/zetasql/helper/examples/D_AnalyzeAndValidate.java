package com.google.pso.zetasql.helper.examples;

import com.google.pso.zetasql.helper.ZetaSQLHelper;
import com.google.pso.zetasql.helper.catalog.bigquery.BigQueryCatalog;
import com.google.pso.zetasql.helper.validation.CannotRecreateExistingTable;
import com.google.pso.zetasql.helper.validation.ValidatingVisitor;
import com.google.pso.zetasql.helper.validation.ValidationError;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.LanguageOptions;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import java.util.Iterator;
import java.util.List;

public class D_AnalyzeAndValidate {

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
        "CREATE TABLE `bigquery-public-data.samples.wikipedia` AS SELECT 1 AS column;\n"
        + "SELECT column FROM `bigquery-public-data.samples.wikipedia`;";
    AnalyzerOptions options = getAnalyzerOptions();

    BigQueryCatalog catalog = new BigQueryCatalog(
        "bigquery-public-data"
    );

    catalog.addAllTablesUsedInQuery(query, options);

    Iterator<ResolvedStatement> statementIterator = ZetaSQLHelper.analyzeStatements(
        query, options, catalog
    );

    List<ValidatingVisitor> validations = List.of(
        new CannotRecreateExistingTable(catalog.getZetaSQLCatalog())
    );

    try {
      ZetaSQLHelper.validateStatements(statementIterator, validations);
      System.out.println("All validations succeeded!");
    } catch (ValidationError error) {
      System.out.println(error.getMessage());
    }
  }

}
