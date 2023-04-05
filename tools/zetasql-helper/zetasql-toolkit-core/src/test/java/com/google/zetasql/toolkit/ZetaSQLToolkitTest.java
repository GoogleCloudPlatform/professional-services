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

package com.google.zetasql.toolkit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.resolvedast.ResolvedNodes.*;
import com.google.zetasql.toolkit.options.BigQueryLanguageOptions;
import com.google.zetasql.toolkit.usage.UsageTracker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class ZetaSQLToolkitTest {

  private ZetaSQLToolkitAnalyzer analyzer;

  @BeforeEach
  void init() {
    UsageTracker mockUsageTracker = mock(UsageTracker.class);

    AnalyzerOptions analyzerOptions = new AnalyzerOptions();
    analyzerOptions.setLanguageOptions(BigQueryLanguageOptions.get());

    this.analyzer = new ZetaSQLToolkitAnalyzer(analyzerOptions, mockUsageTracker);
  }

  @Test
  void testSimpleSelectStmt() {
    String stmt = "SELECT 1 AS col";

    ResolvedStatement analyzedStmt = this.analyzer.analyzeStatements(stmt).next();

    ResolvedQueryStmt queryStmt = assertInstanceOf(ResolvedQueryStmt.class, analyzedStmt);

    ResolvedProjectScan projectScan =
        assertInstanceOf(ResolvedProjectScan.class, queryStmt.getQuery());
    assertInstanceOf(ResolvedSingleRowScan.class, projectScan.getInputScan());
    assertEquals(1, projectScan.getColumnList().size());
    assertAll(
        () -> assertEquals("col", projectScan.getColumnList().get(0).getName()),
        () -> assertTrue(projectScan.getColumnList().get(0).getType().isInteger()));
    assertEquals(1, projectScan.getExprList().size());

    ResolvedLiteral literal =
        assertInstanceOf(ResolvedLiteral.class, projectScan.getExprList().get(0).getExpr());
    assertEquals(1, literal.getValue().getInt64Value());
  }
}
