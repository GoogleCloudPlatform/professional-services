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

import com.google.cloud.bigquery.Routine;

/**
 * Enumeration representing the types of {@link Routine} supported by the BigQuery API. The labels
 * associated with each type match the routine types provided by the BigQuery API through {@link
 * Routine#getRoutineType()}
 */
enum BigQueryAPIRoutineType {
  UDF("SCALAR_FUNCTION"),
  TVF("TABLE_VALUED_FUNCTION"),
  PROCEDURE("PROCEDURE");

  public final String label;

  BigQueryAPIRoutineType(String label) {
    this.label = label;
  }

  public String getLabel() {
    return this.label;
  }
}
