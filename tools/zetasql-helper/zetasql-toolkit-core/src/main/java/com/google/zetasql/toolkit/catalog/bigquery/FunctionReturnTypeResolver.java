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
import com.google.zetasql.Type;
import com.google.zetasql.ZetaSQLFunctions.SignatureArgumentKind;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedExpr;
import com.google.zetasql.toolkit.catalog.bigquery.exceptions.CouldNotInferFunctionReturnType;
import com.google.zetasql.toolkit.catalog.bigquery.exceptions.MissingFunctionReturnType;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Allows resolving the return types of {@link FunctionSignature}s for BigQuery.
 *
 * <p>Resolving implies inferring the function return type based on the function body in case the
 * signature does not have a valid return type. Signatures set to return an unknown type (having
 * {@link TypeKind#TYPE_UNKNOWN} as their return type) or an arbitrary type (having {@link
 * SignatureArgumentKind#ARG_TYPE_ARBITRARY} as their return kind) require inference.
 */
class FunctionReturnTypeResolver {

  /**
   * Infer the return type of a function if necessary.
   *
   * @param signature The signature for which to infer the return type
   * @param body The body of the function in question
   * @param languageOptions The {@link LanguageOptions} to use when performing inference
   * @param catalog The {@link SimpleCatalog} to use when performing inference
   * @return The {@link FunctionArgumentType} that the provided signature should use. Will be the
   *     same as the original if no inference was necessary.
   * @throws CouldNotInferFunctionReturnType if inference fails for any reason
   */
  private static FunctionArgumentType inferFunctionReturnType(
      FunctionSignature signature,
      String body,
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
      return originalReturn;
    }

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
   * @throws MissingFunctionReturnType if the signature does not include a proper return type and it
   *     could not be inferred.
   */
  private static FunctionSignature resolveReturnTypeForFunctionSignature(
      FunctionSignature signature,
      FunctionInfo function,
      LanguageOptions languageOptions,
      SimpleCatalog catalog) {
    Type returnType = signature.getResultType().getType();

    if (returnType != null) {
      // The return type is already known, no need to infer it
      return signature;
    }

    // The return type in unknown, try to infer it
    BigQueryRoutineLanguage language =
        function.getLanguage().orElse(BigQueryRoutineLanguage.LANGUAGE_UNSPECIFIED);

    if (!language.equals(BigQueryRoutineLanguage.SQL)) {
      throw new MissingFunctionReturnType(function.getNamePath());
    }

    String body =
        function.getBody().orElseThrow(() -> new MissingFunctionReturnType(function.getNamePath()));

    try {
      FunctionArgumentType inferredReturnType =
          FunctionReturnTypeResolver.inferFunctionReturnType(
              signature, body, languageOptions, catalog);
      return new FunctionSignature(
          inferredReturnType, signature.getFunctionArgumentList(), signature.getContextId());
    } catch (CouldNotInferFunctionReturnType err) {
      throw new MissingFunctionReturnType(function.getNamePath(), err);
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
   *     type if needed.
   * @return An updated {@link FunctionInfo} with the return types resolved. Any signature where
   *     inference wasn't necessary will remain unchanged.
   * @throws MissingFunctionReturnType if any signature does not include a proper return type and it
   *     could not be inferred.
   */
  public static FunctionInfo resolveFunctionReturnTypesIfNeeded(
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
}
