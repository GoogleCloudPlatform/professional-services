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
package com.google.pso.zetasql.helper.catalog.bigquery;

import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.Routine;
import com.google.cloud.bigquery.Table;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

// Service for getting entities from the BigQuery API
// It caches entities internally, so subsequent requests for the same resource don't hit the API
class BigQueryService {

  private final BigQuery client;
  private final Map<String, Table> cachedTables = new HashMap<>();
  private final Map<String, Routine> cachedRoutines = new HashMap<>();

  public BigQueryService(BigQuery client) {
    this.client = client;
  }

  public static BigQueryService buildDefault() {
    BigQuery bigquery =
        BigQueryOptions.newBuilder().build().getService();

    return new BigQueryService(bigquery);
  }

  public BigQuery getClient() {
    return client;
  }

  private <T> Optional<T> fetchResource(
      String projectId,
      String reference,
      Function<BigQueryReference, T> getter,
      Map<String, T> cache
  ) {
    if(!BigQueryReferenceParser.isValidReference(reference)) {
      return Optional.empty();
    }

    BigQueryReference parsedReference = BigQueryReferenceParser
        .parseReference(projectId, reference);

    return Optional.of(
        cache.computeIfAbsent(
            parsedReference.getFullName(),
            key -> getter.apply(parsedReference)
        )
    );
  }

  // Fetches a BigQuery table from the API
  private Table fetchTableFromAPI(BigQueryReference reference) {
    // TODO: This can fail/return null. Probably use Optional<T>.
    return this.client.getTable(reference.toTableId());
  }

  // Gets a BQ table given its project ID and table reference.
  // It caches tables so that consequent requests for the same table
  // will not hit the API.
  public Optional<Table> fetchTable(String projectId, String tableReference) {
    return this.fetchResource(
        projectId,
        tableReference,
        this::fetchTableFromAPI,
        this.cachedTables
    );
  }

  private Routine fetchRoutineFromAPI(BigQueryReference reference) {
    // TODO: This can fail/return null. Probably use Optional<T>.
    return this.client.getRoutine(reference.toRoutineId());
  }

  public Optional<Routine> fetchRoutine(String projectId, String routineReference) {
    return this.fetchResource(
        projectId,
        routineReference,
        this::fetchRoutineFromAPI,
        this.cachedRoutines
    );
  }

}
