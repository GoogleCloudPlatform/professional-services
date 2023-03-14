package com.google.zetasql.toolkit.catalog.spanner;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.google.zetasql.toolkit.catalog.exceptions.CatalogResourceAlreadyExists;
import com.google.zetasql.toolkit.catalog.spanner.exceptions.InvalidSpannerTableName;
import com.google.zetasql.Column;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.Table;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class SpannerCatalogTest {

  SpannerCatalog spannerCatalog;

  @Mock
  SpannerResourceProvider spannerResourceProviderMock;

  SimpleTable exampleTable = new SimpleTable(
      "SpannerTable",
      List.of(
          new SimpleColumn(
              "SpannerTable",
              "col1",
              TypeFactory.createSimpleType(TypeKind.TYPE_STRING)
          )
      )
  );

  SimpleTable replacementTable = new SimpleTable(
      "SpannerTable",
      List.of(
          new SimpleColumn(
              "SpannerTable",
              "col1",
              TypeFactory.createSimpleType(TypeKind.TYPE_STRING)
          ),
          new SimpleColumn(
              "SpannerTable",
              "col2",
              TypeFactory.createSimpleType(TypeKind.TYPE_INT64)
          )
      )
  );

  @BeforeEach
  void init() {
    this.spannerCatalog = new SpannerCatalog(
        "project", "instance", "database", spannerResourceProviderMock
    );
  }

  Table assertTableExistsInCatalog(SpannerCatalog catalog, SimpleTable table) {
    SimpleCatalog underlyingCatalog = catalog.getZetaSQLCatalog();

    return assertDoesNotThrow(
        () -> underlyingCatalog.findTable(List.of(table.getName()))
    );
  }

  boolean tableEquals(Table expected, Table actual) {
    if(!expected.getName().equals(actual.getName())) {
      return false;
    }

    if(expected.getColumnCount() != actual.getColumnCount()) {
      return false;
    }

    List<? extends Column> expectedColumns = expected.getColumnList()
        .stream()
        .sorted(Comparator.comparing(Column::getName))
        .collect(Collectors.toList());
    List<? extends Column> actualColumns = actual.getColumnList()
        .stream()
        .sorted(Comparator.comparing(Column::getName))
        .collect(Collectors.toList());

    for(int i = 0; i < expectedColumns.size(); i++) {
      Column expectedColumn = expectedColumns.get(i);
      Column actualColumn = actualColumns.get(i);

      if(!expectedColumn.getName().equals(actualColumn.getName())) {
        return false;
      }

      if(!expectedColumn.getType().equals(actualColumn.getType())) {
        return false;
      }
    }

    return true;
  }

  @Test
  void testInvalidSpannerTableNames() {
    String invalidTableName = "Invalid.Spanner.Table.Name";
    SimpleTable table = new SimpleTable(
        invalidTableName,
        TypeFactory.createSimpleType(TypeKind.TYPE_STRING)
    );

    Assertions.assertThrows(
        InvalidSpannerTableName.class,
        () -> this.spannerCatalog.register(
            table, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE
        ),
        "Expected SpannerCatalog to fail when registering a table with an invalid name"
    );

    assertThrows(
        InvalidSpannerTableName.class,
        () -> this.spannerCatalog.addTable(invalidTableName),
        "Expected SpannerCatalog to fail when adding a table with an invalid name"
    );

  }

  @Test
  void testRegisterTable() {
    spannerCatalog.register(
        exampleTable, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE
    );

    Table foundTable = assertTableExistsInCatalog(this.spannerCatalog, exampleTable);

    assertTrue(
        tableEquals(exampleTable, foundTable),
        "Expected table created in Catalog to be equal to the original"
    );
  }

  @Test
  void testReplaceTable() {
    spannerCatalog.register(
        exampleTable, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE
    );

    // Replace the table and validate it has been replaced
    spannerCatalog.register(
        replacementTable, CreateMode.CREATE_OR_REPLACE, CreateScope.CREATE_DEFAULT_SCOPE
    );

    Table foundTable = assertTableExistsInCatalog(this.spannerCatalog, replacementTable);

    assertTrue(
        tableEquals(replacementTable, foundTable),
        "Expected table to have been replaced"
    );
  }

  @Test
  void testTableAlreadyExists() {
    spannerCatalog.register(
        exampleTable, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE
    );

    // Try to replace the table without using CreateMode.CREATE_OR_REPLACE
    Assertions.assertThrows(
        CatalogResourceAlreadyExists.class,
        () -> this.spannerCatalog.register(
            replacementTable, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE
        ),
        "Expected fail creating table that already exists"
    );
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
        tableEquals(exampleTable, foundTable),
        "Expected table created in Catalog to be equal to the original"
    );
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
        tableEquals(exampleTable, foundTable),
        "Expected table created in Catalog to be equal to the original"
    );
  }

  @Test
  void testCopy() {
    SpannerCatalog copy = this.spannerCatalog.copy();

    assertAll(
        () -> assertNotSame(this.spannerCatalog, copy),
        () -> assertNotSame(this.spannerCatalog.getZetaSQLCatalog(), copy.getZetaSQLCatalog())
    );
  }

}
