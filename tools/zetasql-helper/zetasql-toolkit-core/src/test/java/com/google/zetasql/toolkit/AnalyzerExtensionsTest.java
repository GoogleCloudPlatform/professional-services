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

import com.google.zetasql.LanguageOptions;
import com.google.zetasql.ParseResumeLocation;
import com.google.zetasql.toolkit.options.BigQueryLanguageOptions;
import java.util.List;
import org.junit.jupiter.api.Test;

public class AnalyzerExtensionsTest {

  private static final LanguageOptions languageOptions = BigQueryLanguageOptions.get();

  @Test
  void testExtractFunctionNamesFromStatement() {
    String query = "SELECT f1(), c.f2(), `c.f3`();";

    List<List<String>> expected = List.of(List.of("f1"), List.of("c", "f2"), List.of("c.f3"));

    List<List<String>> extractedFunctions =
        AnalyzerExtensions.extractFunctionNamesFromStatement(query, languageOptions);

    assertIterableEquals(expected, extractedFunctions);
  }

  @Test
  void testExtractFunctionNamesFromScript() {
    String script = "INSERT INTO t(column) VALUES (f1(1));\n" + "SELECT c.f2(column) FROM t;\n";

    List<List<String>> expected = List.of(List.of("f1"), List.of("c", "f2"));

    List<List<String>> extractedFunctions =
        AnalyzerExtensions.extractFunctionNamesFromScript(script, languageOptions);

    assertIterableEquals(expected, extractedFunctions);
  }

  @Test
  void testExtractFunctionNamesFromNextStatement() {
    String script = "INSERT INTO t(column) VALUES (f1(1));\n" + "SELECT c.f2(column) FROM t;\n";

    ParseResumeLocation parseResumeLocation = new ParseResumeLocation(script);

    List<List<String>> expected = List.of(List.of("f1"));

    List<List<String>> extractedFunctions =
        AnalyzerExtensions.extractFunctionNamesFromNextStatement(
            parseResumeLocation, languageOptions);

    assertIterableEquals(expected, extractedFunctions);
  }

  @Test
  void testExtractTVFNamesFromStatement() {
    String query = "SELECT * FROM f1(), c.f2(), `c.f3`();";

    List<List<String>> expected = List.of(List.of("f1"), List.of("c", "f2"), List.of("c.f3"));

    List<List<String>> extractedFunctions =
        AnalyzerExtensions.extractTVFNamesFromStatement(query, languageOptions);

    assertIterableEquals(expected, extractedFunctions);
  }

  @Test
  void testExtractTVFNamesFromScript() {
    String script =
        "INSERT INTO t(column) SELECT column FROM f1(1);\n" + "SELECT * FROM c.f2(column);\n";

    List<List<String>> expected = List.of(List.of("f1"), List.of("c", "f2"));

    List<List<String>> extractedFunctions =
        AnalyzerExtensions.extractTVFNamesFromScript(script, languageOptions);

    assertIterableEquals(expected, extractedFunctions);
  }

  @Test
  void testExtractTVFNamesFromNextStatement() {
    String script =
        "INSERT INTO t(column) SELECT column FROM f1(1);\n" + "SELECT * FROM c.f2(column);\n";

    ParseResumeLocation parseResumeLocation = new ParseResumeLocation(script);

    List<List<String>> expected = List.of(List.of("f1"));

    List<List<String>> extractedFunctions =
        AnalyzerExtensions.extractTVFNamesFromNextStatement(parseResumeLocation, languageOptions);

    assertIterableEquals(expected, extractedFunctions);
  }

  @Test
  void testExtractProcedureNamesFromStatement() {
    String query = "CALL p1();";

    List<List<String>> expected = List.of(List.of("p1"));

    List<List<String>> extractedProcedures =
        AnalyzerExtensions.extractProcedureNamesFromStatement(query, languageOptions);

    assertIterableEquals(expected, extractedProcedures);
  }

  @Test
  void testExtractProcedureNamesFromScript() {
    String script = "CALL c.p1(); CALL `c.p2`();";

    List<List<String>> expected = List.of(List.of("c", "p1"), List.of("c.p2"));

    List<List<String>> extractedProcedures =
        AnalyzerExtensions.extractProcedureNamesFromScript(script, languageOptions);

    assertIterableEquals(expected, extractedProcedures);
  }

  @Test
  void testExtractProcedureNamesFromNextStatement() {
    String query = "CALL p1();";

    ParseResumeLocation parseResumeLocation = new ParseResumeLocation(query);

    List<List<String>> expected = List.of(List.of("p1"));

    List<List<String>> extractedProcedures =
        AnalyzerExtensions.extractProcedureNamesFromNextStatement(
            parseResumeLocation, languageOptions);

    assertIterableEquals(expected, extractedProcedures);
  }
}
