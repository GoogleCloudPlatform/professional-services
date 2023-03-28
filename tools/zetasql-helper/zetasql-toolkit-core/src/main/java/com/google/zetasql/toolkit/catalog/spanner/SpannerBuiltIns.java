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

package com.google.zetasql.toolkit.catalog.spanner;

import com.google.zetasql.Function;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.Mode;
import com.google.zetasql.ZetaSQLType.TypeKind;
import java.util.List;

/**
 * Defines functions which are available in Cloud Spanner but are not built into ZetaSQL.
 *
 * @see #addToCatalog(SimpleCatalog) to add these resources to a {@link SimpleCatalog}.
 */
class SpannerBuiltIns {

  private static final String SPANNER_FUNCTION_GROUP = "CloudSpanner";

  public static final List<Function> FUNCTIONS =
      List.of(
          // PENDING_COMMIT_TIMESTAMP() -> TIMESTAMP
          new Function(
              "PENDING_COMMIT_TIMESTAMP",
              SPANNER_FUNCTION_GROUP,
              Mode.SCALAR,
              List.of(
                  new FunctionSignature(
                      new FunctionArgumentType(
                          TypeFactory.createSimpleType(TypeKind.TYPE_TIMESTAMP)),
                      List.of(),
                      -1))));

  /**
   * Adds the defined Spanner-specific functions to the provided {@link SimpleCatalog}
   *
   * @param catalog The SimpleCatalog to which resources should be added
   */
  public static void addToCatalog(SimpleCatalog catalog) {
    FUNCTIONS.forEach(catalog::addFunction);
  }
}
