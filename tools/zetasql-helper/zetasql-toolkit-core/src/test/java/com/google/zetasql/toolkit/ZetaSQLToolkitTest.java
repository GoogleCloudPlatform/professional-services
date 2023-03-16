package com.google.zetasql.toolkit;

import static org.junit.jupiter.api.Assertions.*;

import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.LanguageOptions;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedLiteral;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedProjectScan;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedQueryStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedSingleRowScan;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import org.junit.jupiter.api.Test;

public class ZetaSQLToolkitTest {

  private AnalyzerOptions getAnalyzerOptions() {
    LanguageOptions languageOptions = new LanguageOptions()
        .enableMaximumLanguageFeatures();
    languageOptions.setSupportsAllStatementKinds();

    AnalyzerOptions analyzerOptions = new AnalyzerOptions();
    analyzerOptions.setLanguageOptions(languageOptions);

    return analyzerOptions;
  }

  @Test
  void testSimpleSelectStmt() {
    String stmt = "SELECT 1 AS col";

    ResolvedStatement analyzedStmt = ZetaSQLToolkit
        .analyzeStatements(stmt, getAnalyzerOptions())
        .next();

    ResolvedQueryStmt queryStmt = assertInstanceOf(ResolvedQueryStmt.class, analyzedStmt);

    ResolvedProjectScan projectScan = assertInstanceOf(
        ResolvedProjectScan.class, queryStmt.getQuery()
    );
    assertInstanceOf(ResolvedSingleRowScan.class, projectScan.getInputScan());
    assertEquals(1, projectScan.getColumnList().size());
    assertAll(
        () -> assertEquals("col", projectScan.getColumnList().get(0).getName()),
        () -> assertTrue(projectScan.getColumnList().get(0).getType().isInteger())
    );
    assertEquals(1, projectScan.getExprList().size());

    ResolvedLiteral literal = assertInstanceOf(
        ResolvedLiteral.class, projectScan.getExprList().get(0).getExpr()
    );
    assertEquals(1, literal.getValue().getInt64Value());

  }

}
