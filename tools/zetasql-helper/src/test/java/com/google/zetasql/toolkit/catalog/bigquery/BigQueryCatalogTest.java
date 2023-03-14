package com.google.zetasql.toolkit.catalog.bigquery;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.google.common.base.Preconditions;
import com.google.zetasql.Column;
import com.google.zetasql.NotFoundException;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.Table;
import com.google.zetasql.Type;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateMode;
import com.google.zetasql.resolvedast.ResolvedCreateStatementEnums.CreateScope;
import com.google.zetasql.toolkit.catalog.bigquery.exceptions.InvalidBigQueryReference;
import com.google.zetasql.toolkit.catalog.spanner.SpannerCatalog;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class BigQueryCatalogTest {

  BigQueryCatalog bigQueryCatalog;

  @Mock
  BigQueryResourceProvider bigQueryResourceProvider;

  final String testProjectId = "test-project-id";

  SimpleTable exampleTableInDefaultProject;

  SimpleTable exampleTableInNonDefaultProject;

  @BeforeEach
  void init() {
    this.bigQueryCatalog = new BigQueryCatalog(this.testProjectId, this.bigQueryResourceProvider);

    String exampleTableName = "BigQueryTable";
    this.exampleTableInDefaultProject = new SimpleTable(
        exampleTableName,
        List.of(
            new SimpleColumn(
                exampleTableName,
                "col1",
                TypeFactory.createSimpleType(TypeKind.TYPE_STRING)
            )
        )
    );
    this.exampleTableInDefaultProject.setFullName(
        String.format("%s.dataset.%s", this.testProjectId, exampleTableName)
    );

    this.exampleTableInNonDefaultProject = new SimpleTable(
        this.exampleTableInDefaultProject.getName(),
        this.exampleTableInDefaultProject.getColumnList()
    );
    this.exampleTableInNonDefaultProject.setFullName(
        String.format("%s.dataset.%s", "another-project-id", exampleTableName)
    );
  }

  Table assertTableExistsAtPaths(BigQueryCatalog catalog, List<List<String>> tablePaths) {
    Preconditions.checkNotNull(tablePaths, "Table paths cannot be null");
    Preconditions.checkElementIndex(0, tablePaths.size(), "Table paths cannot be empty");

    SimpleCatalog underlyingCatalog = catalog.getZetaSQLCatalog();

    Stream<Executable> assertions = tablePaths
        .stream()
        .map(tablePath -> (
            () -> assertDoesNotThrow(
                () -> underlyingCatalog.findTable(tablePath),
                String.format(
                    "Expected table to exist at path %s", String.join(".", tablePath)
                )
            )
         ));

    assertAll(assertions);

    try {
      return underlyingCatalog.findTable(tablePaths.get(0));
    } catch (NotFoundException e) {
      throw new AssertionError(e);
    }
  }

  boolean tableColumnsEqual(Table expected, Table actual) {
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
  void testCatalogSupportsBigQueryTypeNames() {
    SimpleCatalog underlyingCatalog = this.bigQueryCatalog.getZetaSQLCatalog();

    Type integerType = assertDoesNotThrow(
        () -> underlyingCatalog.findType(List.of("INTEGER")),
        "BigQuery catalogs should support the INTEGER type name"
    );
    Type decimalType = assertDoesNotThrow(
        () -> underlyingCatalog.findType(List.of("DECIMAL")),
        "BigQuery catalogs should support the DECIMAL type name"
    );

    assertEquals(
        TypeKind.TYPE_INT64, integerType.getKind(),
        "BigQuery catalog's INTEGER type should be an alias for INT64"
    );

    assertEquals(
        TypeKind.TYPE_NUMERIC, decimalType.getKind(),
        "BigQuery catalog's DECIMAL type should be an alias for NUMERIC"
    );
  }

  @Test
  void testRegisterInvalidTableName() {
    String tableName = "TableName";
    String invalidFullName = "An.Invalid.BQ.Reference";
    SimpleTable table = new SimpleTable(
        tableName,
        List.of(
            new SimpleColumn(
                tableName, "column", TypeFactory.createSimpleType(TypeKind.TYPE_STRING)
            )
        )
    );
    table.setFullName(invalidFullName);

    when(
        this.bigQueryResourceProvider.getTables(anyString(), anyList()))
        .thenReturn(List.of(table));

    assertThrows(
        InvalidBigQueryReference.class,
        () -> this.bigQueryCatalog.register(
            table, CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE
        ),
        "Expected BigQueryCatalog to fail when registering a table with an invalid name"
    );

    assertThrows(
        InvalidBigQueryReference.class,
        () -> this.bigQueryCatalog.addTable(invalidFullName),
        "Expected BigQueryCatalog to fail when adding a table with an invalid name"
    );

  }

  @Test
  void testRegisterTableFromDefaultProject() {
    this.bigQueryCatalog.register(
        this.exampleTableInDefaultProject,
        CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE
    );

    BigQueryReference ref = BigQueryReference.from(
        this.testProjectId, this.exampleTableInDefaultProject.getFullName());

    List<List<String>> pathsWhereTableShouldBe = List.of(
        List.of(ref.getProjectId() + "." + ref.getDatasetId() + "." + ref.getResourceName()),
        List.of(ref.getProjectId(), ref.getDatasetId() + "." + ref.getResourceName()),
        List.of(ref.getProjectId() + "." + ref.getDatasetId(), ref.getResourceName()),
        List.of(ref.getProjectId(), ref.getDatasetId(), ref.getResourceName()),
        List.of(ref.getDatasetId() + "." + ref.getResourceName()),
        List.of(ref.getDatasetId(), ref.getResourceName())
    );

    Table foundTable = assertTableExistsAtPaths(this.bigQueryCatalog, pathsWhereTableShouldBe);

    assertTrue(
        tableColumnsEqual(this.exampleTableInDefaultProject, foundTable),
        "Expected table created in Catalog to be equal to the original"
    );
  }

  @Test
  void testRegisterTableFromNonDefaultProject() {
    this.bigQueryCatalog.register(
        this.exampleTableInNonDefaultProject,
        CreateMode.CREATE_DEFAULT, CreateScope.CREATE_DEFAULT_SCOPE
    );

    BigQueryReference ref = BigQueryReference.from(
        this.testProjectId, this.exampleTableInNonDefaultProject.getFullName());

    List<List<String>> pathsWhereTableShouldBe = List.of(
        List.of(ref.getProjectId() + "." + ref.getDatasetId() + "." + ref.getResourceName()),
        List.of(ref.getProjectId(), ref.getDatasetId() + "." + ref.getResourceName()),
        List.of(ref.getProjectId() + "." + ref.getDatasetId(), ref.getResourceName()),
        List.of(ref.getProjectId(), ref.getDatasetId(), ref.getResourceName())
    );

    List<String> pathWhereTableShouldNotBe = List.of(ref.getDatasetId(), ref.getResourceName());

    Table foundTable = assertTableExistsAtPaths(this.bigQueryCatalog, pathsWhereTableShouldBe);

    assertTrue(
        tableColumnsEqual(this.exampleTableInNonDefaultProject, foundTable),
        "Expected table created in Catalog to be equal to the original"
    );

    assertThrows(
        NotFoundException.class,
        () -> this.bigQueryCatalog.getZetaSQLCatalog().findTable(pathWhereTableShouldNotBe),
        "Expected table not in default project to not be available at DATASET.TABLE path"
    );
  }

  @Test
  void testCopy() {
    BigQueryCatalog copy = this.bigQueryCatalog.copy();

    assertAll(
        () -> assertNotSame(this.bigQueryCatalog, copy),
        () -> assertNotSame(this.bigQueryCatalog.getZetaSQLCatalog(), copy.getZetaSQLCatalog())
    );
  }

}
