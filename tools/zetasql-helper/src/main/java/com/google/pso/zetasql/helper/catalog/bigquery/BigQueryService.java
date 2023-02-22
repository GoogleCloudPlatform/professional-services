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

import com.google.api.gax.paging.Page;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQuery.DatasetListOption;
import com.google.cloud.bigquery.BigQuery.RoutineListOption;
import com.google.cloud.bigquery.BigQuery.TableField;
import com.google.cloud.bigquery.BigQuery.TableListOption;
import com.google.cloud.bigquery.BigQuery.TableOption;
import com.google.cloud.bigquery.Dataset;
import com.google.cloud.bigquery.DatasetId;
import com.google.cloud.bigquery.Routine;
import com.google.cloud.bigquery.RoutineId;
import com.google.cloud.bigquery.Table;
import com.google.cloud.bigquery.TableId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

// Service for getting entities from the BigQuery API
// It caches entities internally, so subsequent requests for the same resource don't hit the API
class BigQueryService {

  public static class FetchResult<T> {

    private final Optional<T> result;
    private final Optional<BigQueryCatalogException> error;

    private FetchResult(Optional<T> result, Optional<BigQueryCatalogException> error) {
      this.result = result;
      this.error = error;
    }

    public static <T> FetchResult<T> success(T result) {
      return new FetchResult<>(Optional.of(result), Optional.empty());
    }

    public static <T> FetchResult<T> failure(BigQueryCatalogException error) {
      return new FetchResult<>(Optional.empty(), Optional.of(error));
    }

    public boolean succeeded() {
      return this.result.isPresent();
    }

    public boolean failed() {
      return this.error.isPresent();
    }

    public Optional<T> get() {
      return this.result;
    }

    public Optional<BigQueryCatalogException> getError() {
      return this.error;
    }

  }

  private final BigQuery client;
  private final Map<String, Table> cachedTables = new HashMap<>();
  private final Map<String, Routine> cachedRoutines = new HashMap<>();

  public BigQueryService(BigQuery client) {
    this.client = client;
  }
  
  private <T> Stream<T> pageToStream(Page<T> page) {
    return StreamSupport.stream(page.iterateAll().spliterator(), false);
  }

  private <T> FetchResult<T> fetchResource(
      String projectId,
      String reference,
      Function<BigQueryReference, T> getter,
      Map<String, T> cache
  ) {

    try {
      BigQueryReference parsedReference = BigQueryReference.from(projectId, reference);
      T fetchedResource = cache.computeIfAbsent(
          parsedReference.getFullName(),
          key -> getter.apply(parsedReference)
      );
      return fetchedResource == null
          ? FetchResult.failure(new BigQueryResourceNotFound(parsedReference.getFullName()))
          : FetchResult.success(fetchedResource);
    } catch (InvalidBigQueryReference err) {
      return FetchResult.failure(err);
    }

  }

  public List<DatasetId> listDatasets(String projectId) {
    Page<Dataset> datasets = this.client.listDatasets(
        projectId, DatasetListOption.pageSize(100)
    );

    return this.pageToStream(datasets)
        .map(Dataset::getDatasetId)
        .collect(Collectors.toList());
  }

  // Fetches a BigQuery table from the API
  private Table fetchTableFromAPI(BigQueryReference reference) {
    // TODO: This can fail/return null. Probably use Optional<T>.
    return this.client.getTable(
        reference.toTableId(),
        TableOption.fields(
            TableField.ID,
            TableField.ETAG,
            TableField.TABLE_REFERENCE,
            TableField.SCHEMA
        )
    );
  }

  // Gets a BQ table given its project ID and table reference.
  // It caches tables so that consequent requests for the same table
  // will not hit the API.
  public FetchResult<Table> fetchTable(String projectId, String tableReference) {
    return this.fetchResource(
        projectId,
        tableReference,
        this::fetchTableFromAPI,
        this.cachedTables
    );
  }
  
  public List<TableId> listTables(String projectId, String datasetName) {
    DatasetId datasetId = DatasetId.of(projectId, datasetName);
    
    Page<Table> tables = this.client.listTables(
        datasetId, TableListOption.pageSize(100)
    );

    return this.pageToStream(tables)
        .map(Table::getTableId)
        .collect(Collectors.toList());
  }

  private Routine fetchRoutineFromAPI(BigQueryReference reference) {
    // TODO: This can fail/return null. Probably use Optional<T>.
    return this.client.getRoutine(reference.toRoutineId());
  }

  public FetchResult<Routine> fetchRoutine(String projectId, String routineReference) {
    return this.fetchResource(
        projectId,
        routineReference,
        this::fetchRoutineFromAPI,
        this.cachedRoutines
    );
  }

  public List<RoutineId> listRoutines(String projectId, String datasetName) {
    DatasetId datasetId = DatasetId.of(projectId, datasetName);

    Page<Routine> tables = this.client.listRoutines(
        datasetId, RoutineListOption.pageSize(100)
    );

    return this.pageToStream(tables)
        .map(Routine::getRoutineId)
        .collect(Collectors.toList());
  }

}
