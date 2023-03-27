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

import com.google.api.gax.paging.Page;
import com.google.cloud.bigquery.*;
import com.google.cloud.bigquery.BigQuery.*;
import com.google.zetasql.toolkit.catalog.bigquery.exceptions.BigQueryAPIError;
import com.google.zetasql.toolkit.catalog.bigquery.exceptions.BigQueryCatalogException;
import com.google.zetasql.toolkit.catalog.bigquery.exceptions.BigQueryResourceNotFound;
import com.google.zetasql.toolkit.catalog.bigquery.exceptions.InvalidBigQueryReference;
import com.google.zetasql.toolkit.usage.UsageTracking;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

/**
 * Wrapper service for accessing the BigQuery API. Wraps a BigQuery client and provides utility
 * methods for listing and fetching resources. It caches fetched resources internally, so multiple
 * requests for the same resource only hit the API once.
 *
 * <p>This service implement no cache invalidation and cached resources will stay cached through the
 * lifetime of this object. It might not be suitable for long-running processes.
 *
 * <p>Makes API calls using the zetasql-toolkit user agent
 */
class BigQueryService {

  private final BigQuery client;
  private final Map<String, Table> cachedTables = new HashMap<>();
  private final Map<String, Routine> cachedRoutines = new HashMap<>();

  /**
   * Constructs a BigQueryService with a given BigQuery client.
   *
   * <p>Package-private, only used internally and for testing. To build a new BigQueryService, use
   * {@link #build(BigQuery)} and {@link #buildDefault()}.
   *
   * @param client The BigQuery client for interacting with the API
   */
  BigQueryService(BigQuery client) {
    this.client = client;
  }

  /**
   * Constructs a BigQueryService with a given BigQuery client.
   *
   * <p>The underlying client used by the service will be a copy of the provided client which
   * includes usage tracking headers.
   *
   * @param client The BigQuery client to use when building the service
   * @return The new BigQueryService instance
   */
  public static BigQueryService build(BigQuery client) {
    BigQuery clientWithUsageTracking =
        client
            .getOptions()
            .toBuilder()
            .setHeaderProvider(UsageTracking.HEADER_PROVIDER)
            .build()
            .getService();

    return new BigQueryService(clientWithUsageTracking);
  }

  /**
   * Constructs a BigQueryService using application-default credentials.
   *
   * @return The new BigQueryService instance
   */
  public static BigQueryService buildDefault() {
    return BigQueryService.build(BigQueryOptions.newBuilder().build().getService());
  }

  private <T> Stream<T> pageToStream(Page<T> page) {
    return StreamSupport.stream(page.iterateAll().spliterator(), false);
  }

  /**
   * Higher order method to a BigQuery resource of type T. See {@link #fetchTable(String, String)}
   * and {@link #fetchRoutine(String, String)}.
   *
   * <p>Receives the default BigQuery project id and the BigQuery reference string (e.g.
   * "project.dataset.resource") for the resource to fetch. If the reference is in the for
   * "dataset.resource", the resource is assumed to be in the default project provided.
   *
   * <p>Receives a Function<BigQueryReference, T> that performs the fetching operation, as well as
   * the Map<String, T> to be used as the cache for fetching.
   *
   * @param projectId The default BigQuery project id
   * @param reference The String referencing the resource, e.g. "project.dataset.resource"
   * @param fetcher A Function<BigQueryReference, T> that fetches the resource and might throw a
   *     BigQueryException
   * @param cache The Map<String, T> to use as the cache for this operation
   * @return A Result<T> representing the fetch result
   * @param <T> The type of resource being fetched
   */
  private <T> Result<T> fetchResource(
      String projectId,
      String reference,
      Function<BigQueryReference, T> fetcher,
      Map<String, T> cache) {

    try {
      BigQueryReference parsedReference = BigQueryReference.from(projectId, reference);
      T fetchedResource =
          cache.computeIfAbsent(
              parsedReference.getFullName(), key -> fetcher.apply(parsedReference));
      return fetchedResource == null
          ? Result.failure(new BigQueryResourceNotFound(parsedReference.getFullName()))
          : Result.success(fetchedResource);
    } catch (InvalidBigQueryReference err) {
      return Result.failure(err);
    } catch (BigQueryException err) {
      String message = String.format("Failed to fetch BigQuery resource: %s", reference);
      BigQueryAPIError wrapperError = new BigQueryAPIError(message, err);
      return Result.failure(wrapperError);
    }
  }

  /**
   * Lists datasets in a BigQuery project
   *
   * @param projectId The project id to list datasets from
   * @return A Result<List<DatasetId>> containing the list DatasetId objects
   */
  public Result<List<DatasetId>> listDatasets(String projectId) {
    try {
      Page<Dataset> datasets = this.client.listDatasets(projectId, DatasetListOption.pageSize(100));

      List<DatasetId> datasetIds =
          this.pageToStream(datasets).map(Dataset::getDatasetId).collect(Collectors.toList());

      return Result.success(datasetIds);
    } catch (BigQueryException err) {
      String message = String.format("Failed to list datasets in %s", projectId);
      BigQueryAPIError wrapperError = new BigQueryAPIError(message, err);
      return Result.failure(wrapperError);
    }
  }

  /**
   * Fetches a BigQuery Table from the API.
   *
   * @param reference The BigQueryReference referencing the table
   * @return The fetched Table object, null if not found
   * @throws BigQueryException if an API error occurs
   */
  private Table fetchTableFromAPI(BigQueryReference reference) {
    return this.client.getTable(
        reference.toTableId(),
        TableOption.fields(
            TableField.ID,
            TableField.ETAG,
            TableField.TABLE_REFERENCE,
            TableField.SCHEMA,
            TableField.TIME_PARTITIONING));
  }

  /**
   * Fetches a BigQuery Table from the API. Results are cached indefinitely.
   *
   * @param projectId The default BigQuery project id
   * @param tableReference The String referencing the table,
   * e.g. "project.dataset.table"
   * @return A Result<Table> containing the fetched Table
   */
  public Result<Table> fetchTable(String projectId, String tableReference) {
    return this.fetchResource(
        projectId, tableReference, this::fetchTableFromAPI, this.cachedTables);
  }

  /**
   * Lists tables in a BigQuery dataset
   *
   * @param projectId The project id the dataset belongs to
   * @param datasetName The name of the dataset to list tables from
   * @return A Result<List<TableId>> containing the list TableId objects
   */
  public Result<List<TableId>> listTables(String projectId, String datasetName) {
    DatasetId datasetId = DatasetId.of(projectId, datasetName);

    try {
      Page<Table> tables = this.client.listTables(datasetId, TableListOption.pageSize(100));

      List<TableId> tableIds =
          this.pageToStream(tables).map(Table::getTableId).collect(Collectors.toList());

      return Result.success(tableIds);
    } catch (BigQueryException err) {
      String message =
          String.format(
              "Failed to list tables in dataset %s.%s",
              datasetId.getProject(), datasetId.getDataset());
      BigQueryAPIError wrapperError = new BigQueryAPIError(message, err);
      return Result.failure(wrapperError);
    }
  }

  /**
   * Fetches a BigQuery Routine from the API.
   *
   * @param reference The BigQueryReference referencing the routine
   * @return The fetched Routine object, null if not found
   * @throws BigQueryException if an API error occurs
   */
  private Routine fetchRoutineFromAPI(BigQueryReference reference) {
    return this.client.getRoutine(reference.toRoutineId());
  }

  /**
   * Fetches a BigQuery Routine from the API. Results are cached through the lifetime of this.
   *
   * @param projectId The default BigQuery project id
   * @param routineReference The String referencing the routine, e.g. "project.dataset.routine"
   * @return A Result<Routine> containing the fetched Routine
   */
  public Result<Routine> fetchRoutine(String projectId, String routineReference) {
    return this.fetchResource(
        projectId, routineReference, this::fetchRoutineFromAPI, this.cachedRoutines);
  }

  /**
   * Lists routines in a BigQuery dataset
   *
   * @param projectId The project id the dataset belongs to
   * @param datasetName The name of the dataset to list tables from
   * @return A Result<List<RoutineId>> containing the list RoutineId objects
   */
  public Result<List<RoutineId>> listRoutines(String projectId, String datasetName) {
    DatasetId datasetId = DatasetId.of(projectId, datasetName);

    try {
      Page<Routine> tables = this.client.listRoutines(datasetId, RoutineListOption.pageSize(100));

      List<RoutineId> routineIds =
          this.pageToStream(tables).map(Routine::getRoutineId).collect(Collectors.toList());

      return Result.success(routineIds);
    } catch (BigQueryException err) {
      String message =
          String.format(
              "Failed to list routines in dataset %s.%s",
              datasetId.getProject(), datasetId.getDataset());
      BigQueryAPIError wrapperError = new BigQueryAPIError(message, err);
      return Result.failure(wrapperError);
    }
  }

  /**
   * Result class return by the BigQueryService from API operations. A Result can be successful and
   * contain an object of type T; or have failed and contain an exception.
   *
   * <p>This is a very limited implementation of a functional error handling resource similar to
   * scala.util.Try[T] or kotlin.Result<T>.
   *
   * @param <T> The type of the result for the operation.
   */
  public static class Result<T> {

    private final T result;
    private final BigQueryCatalogException error;

    private Result(T result, BigQueryCatalogException error) {
      assert (result != null && error == null) || (result == null && error != null);
      this.result = result;
      this.error = error;
    }

    /**
     * Builds a successful Result, containing an object of type T.
     *
     * @param result The resulting object
     * @return A successful instance of Result<T>
     * @param <T> The type of the resulting object
     */
    public static <T> Result<T> success(T result) {
      return new Result<>(result, null);
    }

    /**
     * Builds a failed Result, containing an error.
     *
     * @param error The error that caused the failure
     * @return A failed instance of Result<T>
     * @param <T> The originally expected type of the resulting object
     */
    public static <T> Result<T> failure(BigQueryCatalogException error) {
      return new Result<>(null, error);
    }

    /** Returns true if this Result is successful */
    public boolean succeeded() {
      return this.result != null;
    }

    /** Returns true if this Result failed */
    public boolean failed() {
      return this.error != null;
    }

    /**
     * Get the underlying result.
     *
     * @return The underlying result object
     * @throws BigQueryCatalogException if this Result failed
     */
    public T get() {
      if (this.failed()) {
        throw this.error;
      }

      return this.result;
    }

    /**
     * Get the underlying result as an Optional.
     *
     * @return an Optional containing the underlying result if successful, an empty optional
     *     otherwise
     */
    public Optional<T> asOptional() {
      return Optional.ofNullable(this.result);
    }

    /**
     * Get the underlying error.
     *
     * @return an Optional containing the underlying exception if failed, an empty optional
     *     otherwise
     */
    public Optional<BigQueryCatalogException> getError() {
      return Optional.ofNullable(this.error);
    }
  }
}
