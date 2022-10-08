/*
 * Copyright 2022 Google LLC All Rights Reserved
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
package com.pso.bigquery.optimization.exceptions;

import com.google.api.services.bigquery.model.TableReference;
import com.pso.bigquery.optimization.catalog.BigQueryTableParser;

public class TableNotFound extends QueryPatternAnalyzerException {

  private final TableReference tableRef;

  public TableNotFound(TableReference tableRef) {
    super(
        String.format(
            "Table not found: %s", BigQueryTableParser.getStdTablePathFromTableRef(tableRef)));
    this.tableRef = tableRef;
  }

  public TableReference getTableRef() {
    return this.tableRef;
  }
}
