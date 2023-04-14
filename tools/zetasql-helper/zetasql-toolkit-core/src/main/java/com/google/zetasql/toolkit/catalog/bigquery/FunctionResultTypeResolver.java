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

package com.google.zetasql.toolkit.catalog.bigquery;

import com.google.zetasql.Analyzer;
import com.google.zetasql.AnalyzerOptions;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionArgumentType.FunctionArgumentTypeOptions;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.LanguageOptions;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SqlException;
import com.google.zetasql.TVFRelation;
import com.google.zetasql.TVFRelation.Column;
import com.google.zetasql.ZetaSQLFunctions.SignatureArgumentKind;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedCreateTableFunctionStmt;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedExpr;
import com.google.zetasql.toolkit.catalog.bigquery.exceptions.CouldNotInferFunctionReturnType;
import com.google.zetasql.toolkit.catalog.bigquery.exceptions.MissingFunctionResultType;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Allows resolving the result types of {@link FunctionSignature}s for BigQuery.
 *
 * <p>Resolving implies inferring the function or TVF return type based on the function body in case
 * the signature does not have a valid result type.
 *
 * <p>Function signatures set to return an unknown type (having {@link TypeKind#TYPE_UNKNOWN} as
 * their return type) or an arbitrary type (having {@link SignatureArgumentKind#ARG_TYPE_ARBITRARY}
 * as their return kind) require inference.
 *
 * <p>TVF signatures without an explicit output schema require inference.
 */
class FunctionResultTypeResolver {

  /**
   * Infer the return type of a function.
   *
   * @param signature The signature for which to infer the return type
   * @param body The body of the function in question
   * @param languageOptions The {@link LanguageOptions} to use when performing inference
   * @param catalog The {@link SimpleCatalog} to use when performing inference
   * @return A {@link FunctionArgumentType} representing the return type that the provided signature
   *     should use.
   * @throws CouldNotInferFunctionReturnType if inference fails for any reason
   */
  private static FunctionArgumentType inferFunctionReturnType(
      FunctionSignature signature,
      String body,
      LanguageOptions languageOptions,
      SimpleCatalog catalog) {

    AnalyzerOptions analyzerOptions = new AnalyzerOptions();
    analyzerOptions.setLanguageOptions(languageOptions);

    for (FunctionArgumentType argument : signature.getFunctionArgumentList()) {
      if (!argument.isConcrete()) {
        throw new CouldNotInferFunctionReturnType(
            signature, "Cannot infer the return type of a function with templated arguments");
      }

      analyzerOptions.addExpressionColumn(
          argument.getOptions().getArgumentName(), argument.getType());
    }

    try {
      ResolvedExpr analyzedExpression = Analyzer.analyzeExpression(body, analyzerOptions, catalog);
      return new FunctionArgumentType(
          analyzedExpression.getType(), FunctionArgumentTypeOptions.builder().build(), 1);
    } catch (SqlException sqlException) {
      throw new CouldNotInferFunctionReturnType(
          signature, "Failed to infer function return type", sqlException);
    }
  }

  /**
   * Resolves the return type of a {@link FunctionSignature} for a given function represented by the
   * provided {@link FunctionInfo}. If necessary, it will attempt to infer the return type using the
   * function body.
   *
   * <p>It will attempt to infer the return type of signatures set to return an unknown type (having
   * {@link TypeKind#TYPE_UNKNOWN} as their return type) or an arbitrary type (having {@link
   * SignatureArgumentKind#ARG_TYPE_ARBITRARY} as their return kind). Other signatures will be
   * unchanged.
   *
   * <p>Attempting to infer the return type for the signature is done by analyzing the function body
   * using {@link Analyzer#analyzeExpression(String, AnalyzerOptions, SimpleCatalog)}.
   *
   * @param signature The signature for which to infer the return type.
   * @param function The FunctionInfo representing the function. The function language must be SQL
   *     and the function body must be available; otherwise, resolution will fail for functions that
   *     need inference.
   * @param languageOptions The {@link LanguageOptions} to use when performing inference.
   * @param catalog The catalog to use when analyzing the function body in case inferring the return
   *     type if needed.
   * @return An updated {@link FunctionSignature} with the return type resolved. Will be the
   *     original signature if no inference was necessary.
   * @throws MissingFunctionResultType if the signature does not include a proper return type and it
   *     could not be inferred.
   */
  private static FunctionSignature resolveReturnTypeForFunctionSignature(
      FunctionSignature signature,
      FunctionInfo function,
      LanguageOptions languageOptions,
      SimpleCatalog catalog) {

    FunctionArgumentType originalReturn = signature.getResultType();

    boolean returnIsArbitrary =
        originalReturn.getKind().equals(SignatureArgumentKind.ARG_TYPE_ARBITRARY);
    boolean returnIsFixed = originalReturn.getKind().equals(SignatureArgumentKind.ARG_TYPE_FIXED);
    boolean returnTypeIsNull = originalReturn.getType() == null;
    boolean returnIsUnknown = returnIsFixed && returnTypeIsNull;
    boolean shouldInferReturnType = returnIsArbitrary || returnIsUnknown;

    if (!shouldInferReturnType) {
      return signature;
    }

    // The return type in unknown, try to infer it
    BigQueryRoutineLanguage language =
        function.getLanguage().orElse(BigQueryRoutineLanguage.LANGUAGE_UNSPECIFIED);

    if (!language.equals(BigQueryRoutineLanguage.SQL)) {
      throw new MissingFunctionResultType(function.getNamePath());
    }

    String body =
        function.getBody().orElseThrow(() -> new MissingFunctionResultType(function.getNamePath()));

    try {
      FunctionArgumentType inferredReturnType =
          FunctionResultTypeResolver.inferFunctionReturnType(
              signature, body, languageOptions, catalog);
      return new FunctionSignature(
          inferredReturnType, signature.getFunctionArgumentList(), signature.getContextId());
    } catch (CouldNotInferFunctionReturnType err) {
      throw new MissingFunctionResultType(function.getNamePath(), err);
    }
  }

  /**
   * Resolves the return types of the {@link FunctionSignature}s of a given function represented by
   * the provided {@link FunctionInfo}. If necessary, it will attempt to infer the return type using
   * the function body.
   *
   * <p>It will attempt to infer the return type of signatures set to return an unknown type (having
   * {@link TypeKind#TYPE_UNKNOWN} as their return type) or an arbitrary type (having {@link
   * SignatureArgumentKind#ARG_TYPE_ARBITRARY} as their return kind). Other signatures will be
   * unchanged.
   *
   * <p>Attempting to infer the return type for the signature is done by analyzing the function body
   * using {@link Analyzer#analyzeExpression(String, AnalyzerOptions, SimpleCatalog)}.
   *
   * @param functionInfo The FunctionInfo representing the function. The function language must be
   *     SQL and the function body must be available; otherwise, resolution will fail for functions
   *     that need inference.
   * @param languageOptions The {@link LanguageOptions} to use when performing inference.
   * @param catalog The catalog to use when analyzing the function body in case inferring the return
   *     type is needed.
   * @return An updated {@link FunctionInfo} with the return types resolved. Any signature where
   *     inference wasn't necessary will remain unchanged.
   * @throws MissingFunctionResultType if any signature does not include a proper return type and it
   *     could not be inferred.
   */
  public static FunctionInfo resolveFunctionReturnTypes(
      FunctionInfo functionInfo, LanguageOptions languageOptions, SimpleCatalog catalog) {
    List<FunctionSignature> newSignatures =
        functionInfo.getSignatures().stream()
            .map(
                signature ->
                    resolveReturnTypeForFunctionSignature(
                        signature, functionInfo, languageOptions, catalog))
            .collect(Collectors.toList());

    return functionInfo.toBuilder().setSignatures(newSignatures).build();
  }

  /**
   * Infer the output schema of a TVF.
   *
   * <p>The ZetaSQL analyzer does not expose a way to bind arguments when analyzing a statement, so
   * we can't analyze the TVF body directly to infer its output schema. We work around it by
   * building a matching CREATE TABLE FUNCTION statement for the TVF and analyzing that.
   *
   * @param tvfInfo The {@link TVFInfo} representing the TVF
   * @param languageOptions The {@link LanguageOptions} to use when performing inference
   * @param catalog The {@link SimpleCatalog} to use when performing inference
   * @return The {@link TVFRelation} representing the inferred output schema for the function
   * @throws CouldNotInferFunctionReturnType if inference fails for any reason
   */
  private static TVFRelation inferTVFOutputSchema(
      TVFInfo tvfInfo, LanguageOptions languageOptions, SimpleCatalog catalog) {

    String fullFunctionName = String.join(".", tvfInfo.getNamePath());
    String argumentDefinitions =
        tvfInfo.getSignature().getFunctionArgumentList().stream()
            .map(
                functionArgument ->
                    String.format(
                        "%s %s",
                        functionArgument.getOptions().getArgumentName(),
                        functionArgument.getType()))
            .collect(Collectors.joining(", "));

    String body =
        tvfInfo.getBody().orElseThrow(() -> new MissingFunctionResultType(fullFunctionName));

    String createStmt =
        String.format(
            "CREATE TABLE FUNCTION `%s`(%s) AS (%s)", fullFunctionName, argumentDefinitions, body);

    AnalyzerOptions analyzerOptions = new AnalyzerOptions();
    analyzerOptions.setLanguageOptions(languageOptions);

    try {
      ResolvedCreateTableFunctionStmt analyzedStatement =
          (ResolvedCreateTableFunctionStmt)
              Analyzer.analyzeStatement(createStmt, analyzerOptions, catalog);

      List<Column> outputSchemaColumns =
          analyzedStatement.getOutputColumnList().stream()
              .map(
                  resolvedOutputColumn ->
                      Column.create(
                          resolvedOutputColumn.getName(),
                          resolvedOutputColumn.getColumn().getType()))
              .collect(Collectors.toList());

      return TVFRelation.createColumnBased(outputSchemaColumns);
    } catch (SqlException sqlException) {
      throw new CouldNotInferFunctionReturnType(
          tvfInfo.getSignature(), "Failed to infer TVF output schema", sqlException);
    }
  }

  /**
   * Resolves the output schema of a given TVF represented by the provided {@link TVFInfo}. If the
   * output schema is not explicitly set, it will attempt to infer it using the function body.
   *
   * @param tvfInfo The TVFInfo representing the TVF. The function body should be available for
   *     functions requiring inference, otherwise resolution will fail.
   * @param languageOptions The {@link LanguageOptions} to use when performing inference.
   * @param catalog The catalog to use when analyzing the function body in case inference is needed.
   * @return An updated {@link TVFInfo} with the output schema resolved. Will remain unchanged if
   *     inference was not necessary.
   * @throws MissingFunctionResultType if any the TVF did not include an output schema and it could
   *     not be inferred.
   */
  public static TVFInfo resolveTVFOutputSchema(
      TVFInfo tvfInfo, LanguageOptions languageOptions, SimpleCatalog catalog) {

    if (tvfInfo.getOutputSchema().isPresent()) {
      // The output schema is already known, no need to infer it
      return tvfInfo;
    }

    // The return type is unknown, try to infer it

    try {
      TVFRelation newOutputSchema = inferTVFOutputSchema(tvfInfo, languageOptions, catalog);
      return tvfInfo.toBuilder().setOutputSchema(newOutputSchema).build();
    } catch (CouldNotInferFunctionReturnType err) {
      throw new MissingFunctionResultType(tvfInfo.getNamePath(), err);
    }
  }
}
