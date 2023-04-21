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

import com.google.common.collect.ImmutableList;
import com.google.zetasql.LanguageOptions;
import com.google.zetasql.ParseResumeLocation;
import com.google.zetasql.Parser;
import com.google.zetasql.parser.ASTNode;
import com.google.zetasql.parser.ASTNodes.ASTCallStatement;
import com.google.zetasql.parser.ASTNodes.ASTFunctionCall;
import com.google.zetasql.parser.ASTNodes.ASTIdentifier;
import com.google.zetasql.parser.ASTNodes.ASTScript;
import com.google.zetasql.parser.ASTNodes.ASTStatement;
import com.google.zetasql.parser.ASTNodes.ASTTVF;
import com.google.zetasql.parser.ParseTreeVisitor;
import java.util.List;
import org.antlr.v4.runtime.misc.OrderedHashSet;

/** Implements extensions to ZetaSQL's built-in {@link com.google.zetasql.Analyzer} */
public class AnalyzerExtensions {

  /**
   * Extracts the name paths for all functions called in a SQL statement
   *
   * @param sql The SQL statement from which to extract called functions
   * @param options The {@link LanguageOptions} to use when parsing the provided statement
   * @return The list of name paths for all functions called in the statement. If a function is
   *     called multiple times with different quoting (e.g. `catalog.function()` vs
   *     catalog.function()), it will be returned multiple times.
   */
  public static List<List<String>> extractFunctionNamesFromStatement(
      String sql, LanguageOptions options) {
    ASTStatement statement = Parser.parseStatement(sql, options);
    return extractFunctionNamesFromASTNode(statement);
  }

  /**
   * Extracts the name paths for all functions called in a SQL script
   *
   * @param sql The SQL script from which to extract called functions
   * @param options The {@link LanguageOptions} to use when parsing the provided script
   * @return The list of name paths for all functions called in the script. If a function is called
   *     multiple times with different quoting (e.g. `catalog.function()` vs catalog.function()), it
   *     will be returned multiple times.
   */
  public static List<List<String>> extractFunctionNamesFromScript(
      String sql, LanguageOptions options) {
    ASTScript script = Parser.parseScript(sql, options);
    return extractFunctionNamesFromASTNode(script);
  }

  /**
   * Extracts the name paths for all functions called in the next statement in the provided {@link
   * ParseResumeLocation}.
   *
   * @param parseResumeLocation The ParseResumeLocation from which to extract called functions
   * @param options The {@link LanguageOptions} to use when parsing the statement
   * @return The list of name paths for all functions called in the statement. If a function is
   *     called multiple times with different quoting (e.g. `catalog.function()` vs
   *     catalog.function()), it will be returned multiple times.
   */
  public static List<List<String>> extractFunctionNamesFromNextStatement(
      ParseResumeLocation parseResumeLocation, LanguageOptions options) {
    ASTStatement statement = Parser.parseNextStatement(parseResumeLocation, options);
    return extractFunctionNamesFromASTNode(statement);
  }

  /**
   * Extracts the name paths for all functions called in the provided parse tree
   *
   * @param node The root of the parse tree from which to extract functions called
   * @return The list of name paths for all functions called in the tree. If a function is called
   *     multiple times with different quoting (e.g. `catalog.function()` vs catalog.function()), it
   *     will be returned multiple times.
   */
  private static List<List<String>> extractFunctionNamesFromASTNode(ASTNode node) {
    OrderedHashSet<ImmutableList<String>> result = new OrderedHashSet<>();

    ParseTreeVisitor extractFunctionNamesVisitor =
        new ParseTreeVisitor() {

          @Override
          public void visit(ASTFunctionCall functionCall) {
            ImmutableList<String> functionNamePath =
                functionCall.getFunction().getNames().stream()
                    .map(ASTIdentifier::getIdString)
                    .collect(ImmutableList.toImmutableList());
            result.add(functionNamePath);
          }
        };

    node.accept(extractFunctionNamesVisitor);

    return List.copyOf(result);
  }

  /**
   * Extracts the name paths for all TVFs called in a SQL statement
   *
   * @param sql The SQL statement from which to extract called functions
   * @param options The {@link LanguageOptions} to use when parsing the provided statement
   * @return The list of name paths for all functions called in the statement. If a function is
   *     called multiple times with different quoting (e.g. `catalog.function()` vs
   *     catalog.function()), it will be returned multiple times.
   */
  public static List<List<String>> extractTVFNamesFromStatement(
      String sql, LanguageOptions options) {
    ASTStatement statement = Parser.parseStatement(sql, options);
    return extractTVFNamesFromASTNode(statement);
  }

  /**
   * Extracts the name paths for all TVFs called in a SQL script
   *
   * @param sql The SQL script from which to extract called functions
   * @param options The {@link LanguageOptions} to use when parsing the provided script
   * @return The list of name paths for all functions called in the script. If a function is called
   *     multiple times with different quoting (e.g. `catalog.function()` vs catalog.function()), it
   *     will be returned multiple times.
   */
  public static List<List<String>> extractTVFNamesFromScript(String sql, LanguageOptions options) {
    ASTScript script = Parser.parseScript(sql, options);
    return extractTVFNamesFromASTNode(script);
  }

  /**
   * Extracts the name paths for all TVFs called in the next statement in the provided {@link
   * ParseResumeLocation}.
   *
   * @param parseResumeLocation The ParseResumeLocation from which to extract called functions
   * @param options The {@link LanguageOptions} to use when parsing the statement
   * @return The list of name paths for all functions called in the statement. If a function is
   *     called multiple times with different quoting (e.g. `catalog.function()` vs
   *     catalog.function()), it will be returned multiple times.
   */
  public static List<List<String>> extractTVFNamesFromNextStatement(
      ParseResumeLocation parseResumeLocation, LanguageOptions options) {
    ASTStatement statement = Parser.parseNextStatement(parseResumeLocation, options);
    return extractTVFNamesFromASTNode(statement);
  }

  /**
   * Extracts the name paths for all TVFs called in the provided parse tree
   *
   * @param node The root of the parse tree from which to extract functions called
   * @return The list of name paths for all functions called in the tree. If a function is called
   *     multiple times with different quoting (e.g. `catalog.function()` vs catalog.function()), it
   *     will be returned multiple times.
   */
  private static List<List<String>> extractTVFNamesFromASTNode(ASTNode node) {
    OrderedHashSet<ImmutableList<String>> result = new OrderedHashSet<>();

    ParseTreeVisitor extractFunctionNamesVisitor =
        new ParseTreeVisitor() {

          @Override
          public void visit(ASTTVF tvfCall) {
            ImmutableList<String> functionNamePath =
                tvfCall.getName().getNames().stream()
                    .map(ASTIdentifier::getIdString)
                    .collect(ImmutableList.toImmutableList());
            result.add(functionNamePath);
          }
        };

    node.accept(extractFunctionNamesVisitor);

    return List.copyOf(result);
  }

  /**
   * Extracts the name paths for all procedures called in a SQL statement. It can either return one
   * procedure or no procedures, depending on whether the provided statement is a CALL statement.
   *
   * @param sql The SQL statement from which to extract called procedures
   * @param options The {@link LanguageOptions} to use when parsing the provided statement
   * @return The list of name paths for all procedures called in the statement. If a procedure is
   *     called multiple times with different quoting (e.g. `catalog.procedure()` vs
   *     catalog.procedure()), it will be returned multiple times.
   */
  public static List<List<String>> extractProcedureNamesFromStatement(
      String sql, LanguageOptions options) {
    ASTStatement statement = Parser.parseStatement(sql, options);
    return extractProcedureNamesFromASTNode(statement);
  }

  /**
   * Extracts the name paths for all procedures called in a SQL script
   *
   * @param sql The SQL script from which to extract called procedures
   * @param options The {@link LanguageOptions} to use when parsing the provided script
   * @return The list of name paths for all procedures called in the script. If a procedure is
   *     called multiple times with different quoting (e.g. `catalog.procedure()` vs
   *     catalog.procedure()), it will be returned multiple times.
   */
  public static List<List<String>> extractProcedureNamesFromScript(
      String sql, LanguageOptions options) {
    ASTScript script = Parser.parseScript(sql, options);
    return extractProcedureNamesFromASTNode(script);
  }

  /**
   * Extracts the name paths for all procedures called in the next statement in the provided {@link
   * ParseResumeLocation}. It can either return one procedure or no procedures, depending on whether
   * the statement is a CALL statement.
   *
   * @param parseResumeLocation The ParseResumeLocation from which to extract called procedures
   * @param options The {@link LanguageOptions} to use when parsing the statement
   * @return The list of name paths for all procedures called in the statement. If a procedure is
   *     called multiple times with different quoting (e.g. `catalog.procedure()` vs
   *     catalog.procedure()), it will be returned multiple times.
   */
  public static List<List<String>> extractProcedureNamesFromNextStatement(
      ParseResumeLocation parseResumeLocation, LanguageOptions options) {
    ASTStatement statement = Parser.parseNextStatement(parseResumeLocation, options);
    return extractProcedureNamesFromASTNode(statement);
  }

  /**
   * Extracts the name paths for all procedures called in the provided parse tree
   *
   * @param node The root of the parse tree from which to extract procedures called
   * @return The list of name paths for all procedures called in the tree. If a procedure is called
   *     multiple times with different quoting (e.g. `catalog.procedure()` vs catalog.procedure()),
   *     it will be returned multiple times.
   */
  private static List<List<String>> extractProcedureNamesFromASTNode(ASTNode node) {
    OrderedHashSet<ImmutableList<String>> result = new OrderedHashSet<>();

    ParseTreeVisitor extractProcedureNamesVisitor =
        new ParseTreeVisitor() {

          @Override
          public void visit(ASTCallStatement procedureCall) {
            ImmutableList<String> functionNamePath =
                procedureCall.getProcedureName().getNames().stream()
                    .map(ASTIdentifier::getIdString)
                    .collect(ImmutableList.toImmutableList());
            result.add(functionNamePath);
          }
        };

    node.accept(extractProcedureNamesVisitor);

    return List.copyOf(result);
  }

  private AnalyzerExtensions() {}
}
