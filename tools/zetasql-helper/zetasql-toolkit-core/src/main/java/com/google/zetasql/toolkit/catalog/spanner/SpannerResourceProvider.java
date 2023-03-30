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

import com.google.zetasql.SimpleTable;
import java.util.List;

/** Interface for an object that can find and provide Spanner resources */
public interface SpannerResourceProvider {

  /**
   * Gets a set of Spanner tables or views and returns them as {@link SimpleTable}s
   *
   * @param tableNames The names of the tables that should be retrieved.
   * @return The list of SimpleTables representing the requested Spanner tables and views.
   */
  List<SimpleTable> getTables(List<String> tableNames);

  /**
   * Gets a all Spanner tables and views in the Spanner database and returns them as {@link
   * SimpleTable}s
   *
   * @return The list of SimpleTables representing the Spanner tables and views.
   */
  List<SimpleTable> getAllTablesInDatabase();
}
