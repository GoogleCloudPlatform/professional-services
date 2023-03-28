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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.google.api.gax.paging.Page;
import com.google.cloud.bigquery.*;
import com.google.zetasql.toolkit.catalog.bigquery.BigQueryService.Result;
import com.google.zetasql.toolkit.catalog.bigquery.exceptions.BigQueryAPIError;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class BigQueryServiceTest {

  BigQueryService bigQueryService;

  @Mock BigQuery bigqueryClientMock;

  @BeforeEach
  void init() {
    this.bigQueryService = new BigQueryService(this.bigqueryClientMock);
  }

  @SuppressWarnings("unchecked")
  <T> Page<T> createMockPage(List<T> items) {
    Page<T> page = (Page<T>) mock(Page.class);

    lenient().when(page.hasNextPage()).thenReturn(false);
    lenient().when(page.getNextPageToken()).thenReturn(null);
    lenient().when(page.getNextPage()).thenReturn(null);
    lenient().when(page.iterateAll()).thenReturn(items);
    lenient().when(page.getValues()).thenReturn(items);

    return page;
  }

  @Test
  void testListDatasets() {
    String projectId = "project";
    String datasetName = "dataset";
    DatasetId datasetId = DatasetId.of(projectId, datasetName);

    Dataset mockDataset = mock(Dataset.class);
    when(mockDataset.getDatasetId()).thenReturn(datasetId);

    Page<Dataset> mockPage = createMockPage(List.of(mockDataset));
    when(bigqueryClientMock.listDatasets(anyString(), any())).thenReturn(mockPage);

    Result<List<DatasetId>> listDatasetsResult = bigQueryService.listDatasets(projectId);

    assertTrue(listDatasetsResult.succeeded(), "Expected listing datasets to succeed");

    List<DatasetId> listedDatasetIds = listDatasetsResult.get();

    assertIterableEquals(List.of(datasetId), listedDatasetIds);
  }

  @Test
  void testListTables() {
    String projectId = "project";
    String datasetName = "dataset";
    String tableName = "table";
    TableId tableId = TableId.of(projectId, datasetName, tableName);

    Table mockTable = mock(Table.class);
    when(mockTable.getTableId()).thenReturn(tableId);

    Page<Table> mockPage = createMockPage(List.of(mockTable));
    when(bigqueryClientMock.listTables(any(DatasetId.class), any())).thenReturn(mockPage);

    Result<List<TableId>> listTablesResult = bigQueryService.listTables(projectId, datasetName);

    assertTrue(listTablesResult.succeeded(), "Expected listing tables to succeed");

    List<TableId> listedTableIds = listTablesResult.get();

    assertIterableEquals(List.of(tableId), listedTableIds);
  }

  @Test
  void testListRoutines() {
    String projectId = "project";
    String datasetName = "dataset";
    String routineName = "routine";
    RoutineId routineId = RoutineId.of(projectId, datasetName, routineName);

    Routine mockRoutine = mock(Routine.class);
    when(mockRoutine.getRoutineId()).thenReturn(routineId);

    Page<Routine> mockPage = createMockPage(List.of(mockRoutine));
    when(bigqueryClientMock.listRoutines(any(DatasetId.class), any())).thenReturn(mockPage);

    Result<List<RoutineId>> listRoutinesResult =
        bigQueryService.listRoutines(projectId, datasetName);

    assertTrue(listRoutinesResult.succeeded(), "Expected listing routines to succeed");

    List<RoutineId> listedRoutineIds = listRoutinesResult.get();

    assertIterableEquals(List.of(routineId), listedRoutineIds);
  }

  @Test
  void testFetchTable() {
    Table mockTable = mock(Table.class);
    when(bigqueryClientMock.getTable(any(TableId.class), any())).thenReturn(mockTable);

    Result<Table> fetchTableResult = bigQueryService.fetchTable("project", "dataset.table");

    assertTrue(fetchTableResult.succeeded(), "Expected fetching table to succeed");
    assertSame(mockTable, fetchTableResult.get());
  }

  @Test
  void testFetchRoutine() {
    Routine mockRoutine = mock(Routine.class);
    when(bigqueryClientMock.getRoutine(any(RoutineId.class))).thenReturn(mockRoutine);

    Result<Routine> fetchRoutineResult = bigQueryService.fetchRoutine("project", "dataset.routine");

    assertTrue(fetchRoutineResult.succeeded(), "Expected fetching routine to succeed");
    assertSame(mockRoutine, fetchRoutineResult.get());
  }

  @Test
  void testAPIError() {
    when(bigqueryClientMock.listDatasets(anyString(), any())).thenThrow(BigQueryException.class);
    when(bigqueryClientMock.getTable(any(TableId.class), any())).thenThrow(BigQueryException.class);

    assertThrows(
        BigQueryAPIError.class,
        () -> bigQueryService.listDatasets("project").get(),
        "Expected BigQuery API when listing error to bubble up");

    assertThrows(
        BigQueryAPIError.class,
        () -> bigQueryService.fetchTable("project", "dataset.table").get(),
        "Expected BigQuery API when fetching tables error to bubble up");
  }

  @Test
  void testCache() {
    Table mockTable = mock(Table.class);
    when(bigqueryClientMock.getTable(any(TableId.class), any())).thenReturn(mockTable);

    Routine mockRoutine = mock(Routine.class);
    when(bigqueryClientMock.getRoutine(any(RoutineId.class))).thenReturn(mockRoutine);

    // Fetch the same table twice, expect the second call to have been cached
    bigQueryService.fetchTable("project", "dataset.table");
    bigQueryService.fetchTable("project", "dataset.table");

    verify(bigqueryClientMock, times(1)).getTable(any(TableId.class), any());

    // Fetch the same table routine, expect the second call to have been cached
    bigQueryService.fetchRoutine("project", "dataset.routine");
    bigQueryService.fetchRoutine("project", "dataset.routine");

    verify(bigqueryClientMock, times(1)).getRoutine(any(RoutineId.class));
  }
}
