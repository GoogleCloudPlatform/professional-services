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

import com.google.zetasql.*;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import com.google.zetasql.toolkit.catalog.CatalogTestUtils;
import com.google.zetasql.toolkit.catalog.exceptions.CatalogResourceAlreadyExists;
import com.google.zetasql.toolkit.catalog.spanner.exceptions.InvalidSpannerTableName;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class SpannerCatalogTest {

  SpannerCatalog spannerCatalog;

  @Mock SpannerResourceProvider spannerResourceProviderMock;

  SimpleTable exampleTable =
      new SimpleTable(
          "SpannerTable",
          List.of(
              new SimpleColumn(
                  "SpannerTable", "col1", TypeFactory.createSimpleType(TypeKind.TYPE_STRING))));

  SimpleTable replacementTable =
      new SimpleTable(
          "SpannerTable",
          List.of(
              new SimpleColumn(
                  "SpannerTable", "col1", TypeFactory.createSimpleType(TypeKind.TYPE_STRING)),
              new SimpleColumn(
                  "SpannerTable", "col2", TypeFactory.createSimpleType(TypeKind.TYPE_INT64))));

  @BeforeEach
  void init() {
    this.spannerCatalog =
        new SpannerCatalog("project", "instance", "database", spannerResourceProviderMock);
  }

  private Table assertTableExistsInCatalog(SpannerCatalog catalog, SimpleTable table) {
    SimpleCatalog underlyingCatalog = catalog.getZetaSQLCatalog();

    return assertDoesNotThrow(() -> underlyingCatalog.findTable(List.of(table.getName())));
  }

  private void assertTableDoesNotExistInCatalog(SpannerCatalog catalog, String tableName) {
    SimpleCatalog underlyingCatalog = catalog.getZetaSQLCatalog();

    assertThrows(NotFoundException.class, () -> underlyingCatalog.findTable(List.of(tableName)));
  }

  @Test
  void testInvalidSpannerTableNames() {
    String invalidTableName = "Invalid.Spanner.Table.Name";
    SimpleTable table =
        new SimpleTable(invalidTableName, TypeFactory.createSimpleType(TypeKind.TYPE_STRING));

    Assertions.assertThrows(
        InvalidSpannerTableName.class,
        () ->
            this.spannerCatalog.register(
                table, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE),
        "Expected SpannerCatalog to fail when registering a table with an invalid name");

    assertThrows(
        InvalidSpannerTableName.class,
        () -> this.spannerCatalog.addTable(invalidTableName),
        "Expected SpannerCatalog to fail when adding a table with an invalid name");
  }

  @Test
  void testRegisterTable() {
    spannerCatalog.register(
        exampleTable, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE);

    Table foundTable = assertTableExistsInCatalog(this.spannerCatalog, exampleTable);

    assertTrue(
        CatalogTestUtils.tableEquals(exampleTable, foundTable),
        "Expected table created in Catalog to be equal to the original");
  }

  @Test
  void testRemoveTable() {
    spannerCatalog.register(
        exampleTable, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE);

    spannerCatalog.removeTable(exampleTable.getName());

    assertTableDoesNotExistInCatalog(spannerCatalog, exampleTable.getName());
  }

  @Test
  void testReplaceTable() {
    spannerCatalog.register(
        exampleTable, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE);

    // Replace the table and validate it has been replaced
    spannerCatalog.register(
        replacementTable, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE);

    Table foundTable = assertTableExistsInCatalog(this.spannerCatalog, replacementTable);

    assertTrue(
        CatalogTestUtils.tableEquals(replacementTable, foundTable),
        "Expected table to have been replaced");
  }

  @Test
  void testTableAlreadyExists() {
    spannerCatalog.register(
        exampleTable, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE);

    // Try to replace the table without using CreateMode.CREATE_OR_REPLACE
    Assertions.assertThrows(
        CatalogResourceAlreadyExists.class,
        () ->
            this.spannerCatalog.register(
                replacementTable, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE),
        "Expected fail creating table that already exists");
  }

  @Test
  void testAddTablesByName() {
    // When SpannerResourceProvider.getTables() is called, return the test table
    when(spannerResourceProviderMock.getTables(anyList())).thenReturn(List.of(exampleTable));

    // Add the tables by name
    spannerCatalog.addTables(List.of(exampleTable.getName()));

    // Verify the SpannerCatalog got the tables from the SpannerResourceProvider
    verify(spannerResourceProviderMock, times(1)).getTables(anyList());

    // Verify the test table was added to the catalog
    Table foundTable = assertTableExistsInCatalog(this.spannerCatalog, exampleTable);

    assertTrue(
        CatalogTestUtils.tableEquals(exampleTable, foundTable),
        "Expected table created in Catalog to be equal to the original");
  }

  @Test
  void testAddAllTablesInDatabase() {
    // When SpannerResourceProvider.getAllTablesInDatabase() is called, return the test table
    when(spannerResourceProviderMock.getAllTablesInDatabase()).thenReturn(List.of(exampleTable));

    // Add the tables by name
    spannerCatalog.addAllTablesInDatabase();

    // Verify the SpannerCatalog got the tables from the SpannerResourceProvider
    verify(spannerResourceProviderMock, times(1)).getAllTablesInDatabase();

    // Verify the test table was added to the catalog
    Table foundTable = assertTableExistsInCatalog(this.spannerCatalog, exampleTable);

    assertTrue(
        CatalogTestUtils.tableEquals(exampleTable, foundTable),
        "Expected table created in Catalog to be equal to the original");
  }

  @Test
  void testCopy() {
    SpannerCatalog copy = this.spannerCatalog.copy();

    assertAll(
        () -> assertNotSame(this.spannerCatalog, copy),
        () -> assertNotSame(this.spannerCatalog.getZetaSQLCatalog(), copy.getZetaSQLCatalog()));
  }
}
