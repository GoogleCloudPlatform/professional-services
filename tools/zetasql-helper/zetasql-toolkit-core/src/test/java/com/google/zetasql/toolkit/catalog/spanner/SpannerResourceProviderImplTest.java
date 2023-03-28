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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.google.cloud.spanner.DatabaseClient;
import com.google.cloud.spanner.ResultSet;
import com.google.cloud.spanner.Spanner;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.toolkit.catalog.CatalogTestUtils;
import com.google.zetasql.toolkit.catalog.spanner.exceptions.SpannerTablesNotFound;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class SpannerResourceProviderImplTest {

  SpannerResourceProviderImpl spannerResourceProvider;

  @Mock Spanner spannerClient;

  @Mock(answer = Answers.RETURNS_DEEP_STUBS)
  DatabaseClient dbClient;

  SimpleTable exampleTable =
      new SimpleTable(
          "table",
          List.of(
              new SimpleColumn(
                  "table", "column", TypeFactory.createSimpleType(TypeKind.TYPE_STRING))));

  @BeforeEach
  void init() {
    when(spannerClient.getDatabaseClient(any())).thenReturn(dbClient);
    this.spannerResourceProvider =
        new SpannerResourceProviderImpl("project", "instance", "database", spannerClient);
  }

  ResultSet resultSetForExampleTable() {
    ResultSet resultSet = mock(ResultSet.class);
    when(resultSet.next()).thenReturn(true).thenReturn(false);
    when(resultSet.getString(eq("table_name"))).thenReturn("table");
    when(resultSet.getString(eq("column_name"))).thenReturn("column");
    when(resultSet.getString(eq("spanner_type"))).thenReturn("STRING");
    return resultSet;
  }

  @Test
  void testGetTables() {
    ResultSet resultSetForExampleTable = resultSetForExampleTable();
    when(dbClient.singleUse().executeQuery(any())).thenReturn(resultSetForExampleTable);

    List<SimpleTable> tables = spannerResourceProvider.getTables(List.of("table"));

    assertEquals(1, tables.size());
    assertTrue(CatalogTestUtils.tableEquals(exampleTable, tables.get(0)));
  }

  @Test
  void testTableNotFound() {
    ResultSet resultSet = mock(ResultSet.class);
    when(resultSet.next()).thenReturn(false);
    when(dbClient.singleUse().executeQuery(any())).thenReturn(resultSet);

    assertThrows(
        SpannerTablesNotFound.class, () -> spannerResourceProvider.getTables(List.of("table")));
  }
}
