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

package com.google.zetasql.toolkit.catalog.bigquery.exceptions;

public class MissingRoutineReturnType extends BigQueryCatalogException {

  private final String routineReference;

  public MissingRoutineReturnType(String routineReference) {
    super(
        String.format(
            "BigQuery routine %s is missing an explicit return type. UDFs and Table Valued Functions "
                + "should be define with a RETURNS clause.",
            routineReference));
    this.routineReference = routineReference;
  }

  public String getRoutineReference() {
    return routineReference;
  }
}
