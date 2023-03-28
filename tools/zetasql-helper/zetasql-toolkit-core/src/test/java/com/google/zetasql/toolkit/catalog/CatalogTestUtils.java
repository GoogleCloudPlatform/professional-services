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

package com.google.zetasql.toolkit.catalog;

import com.google.zetasql.Column;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.Table;
import com.google.zetasql.ZetaSQLFunctions.SignatureArgumentKind;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class CatalogTestUtils {

  private CatalogTestUtils() {}

  public static boolean tableColumnsEqual(
      List<? extends Column> expected, List<? extends Column> actual) {

    if (expected.size() != actual.size()) {
      return false;
    }

    expected =
        expected.stream()
            .sorted(Comparator.comparing(Column::getName))
            .collect(Collectors.toList());
    actual =
        actual.stream().sorted(Comparator.comparing(Column::getName)).collect(Collectors.toList());

    for (int i = 0; i < expected.size(); i++) {
      Column expectedColumn = expected.get(i);
      Column actualColumn = actual.get(i);

      if (!expectedColumn.getName().equals(actualColumn.getName())) {
        return false;
      }

      if (!expectedColumn.getType().equals(actualColumn.getType())) {
        return false;
      }
    }

    return true;
  }

  public static boolean tableColumnsEqual(Table expected, Table actual) {
    return tableColumnsEqual(expected.getColumnList(), actual.getColumnList());
  }

  public static boolean tableEquals(Table expected, Table actual) {
    if (!expected.getName().equals(actual.getName())) {
      return false;
    }

    if (expected.getColumnCount() != actual.getColumnCount()) {
      return false;
    }

    List<? extends Column> expectedColumns =
        expected.getColumnList().stream()
            .sorted(Comparator.comparing(Column::getName))
            .collect(Collectors.toList());
    List<? extends Column> actualColumns =
        actual.getColumnList().stream()
            .sorted(Comparator.comparing(Column::getName))
            .collect(Collectors.toList());

    for (int i = 0; i < expectedColumns.size(); i++) {
      Column expectedColumn = expectedColumns.get(i);
      Column actualColumn = actualColumns.get(i);

      if (!expectedColumn.getName().equals(actualColumn.getName())) {
        return false;
      }

      if (!expectedColumn.getType().equals(actualColumn.getType())) {
        return false;
      }
    }

    return true;
  }

  public static boolean functionArgumentEquals(
      FunctionArgumentType expected, FunctionArgumentType actual) {

    return Objects.equals(expected.isConcrete(), actual.isConcrete())
        && Objects.equals(expected.getKind(), actual.getKind())
        && Objects.equals(expected.getType(), actual.getType())
        && Objects.equals(expected.getNumOccurrences(), actual.getNumOccurrences())
        && Objects.equals(expected.getCardinality(), actual.getCardinality())
        && (!expected.getKind().equals(SignatureArgumentKind.ARG_TYPE_RELATION)
            || Objects.equals(expected.getRelation(), actual.getRelation()))
        && Objects.equals(
            expected.getOptions().getArgumentName(), actual.getOptions().getArgumentName())
        && Objects.equals(
            expected.getOptions().getProcedureArgumentMode(),
            actual.getOptions().getProcedureArgumentMode());
  }

  public static boolean functionSignatureEquals(
      FunctionSignature expected, FunctionSignature actual) {
    if (!functionArgumentEquals(expected.getResultType(), actual.getResultType())) {
      return false;
    }

    if (expected.getFunctionArgumentList().size() != actual.getFunctionArgumentList().size()) {
      return false;
    }

    for (int i = 0; i < expected.getFunctionArgumentList().size(); i++) {
      FunctionArgumentType expectedArgument = expected.getFunctionArgumentList().get(i);
      FunctionArgumentType actualArgument = actual.getFunctionArgumentList().get(i);
      if (!functionArgumentEquals(expectedArgument, actualArgument)) {
        return false;
      }
    }

    return true;
  }
}
