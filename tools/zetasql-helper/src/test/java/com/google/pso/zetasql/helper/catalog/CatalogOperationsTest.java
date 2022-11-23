package com.google.pso.zetasql.helper.catalog;

import static org.junit.jupiter.api.Assertions.*;

import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.SimpleTable;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLType.TypeKind;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

class CatalogOperationsTest {

  SimpleCatalog testCatalog;

  private SimpleCatalog createSampleCatalog(String name) {
    SimpleCatalog catalog = new SimpleCatalog(name);
    SimpleTable sampleTable = new SimpleTable(
        "sample",
        List.of(
            new SimpleColumn(
                "sample",
                "column",
                TypeFactory.createSimpleType(TypeKind.TYPE_STRING)
            )
        )
    );
    catalog.addSimpleTable(sampleTable);
    return catalog;
  }

  @BeforeEach
  void setUp() {
    this.testCatalog = this.createSampleCatalog("catalog");
    this.testCatalog.addSimpleCatalog(
        this.createSampleCatalog("nested")
    );
  }

  @Test
  void shallowCopyCatalog() {
    SimpleCatalog copiedCatalog = CatalogOperations.copyCatalog(this.testCatalog, false);

    List<String> sampleTablePath = List.of("sample");
    List<String> nestedTablePath = List.of("nested", "sample");

    assertAll(
        () -> assertDoesNotThrow(
            () -> copiedCatalog.findTable(sampleTablePath),
            "Existing table was not found in copied catalog"
        ),
        () -> assertDoesNotThrow(
            () -> copiedCatalog.findTable(nestedTablePath),
            "Existing table was not found in copied nested catalog"
        ),
        () -> assertEquals(
            "sample",
            copiedCatalog.findTable(sampleTablePath).getName(),
            "Table name in copied catalog didn't match original"
        ),
        () -> assertEquals(
            "column",
            copiedCatalog.findTable(sampleTablePath).getColumn(0).getName(),
            "Column name in copied catalog didn't match original"
        ),
        () -> assertSame(
            copiedCatalog.findTable(sampleTablePath),
            this.testCatalog.findTable(sampleTablePath),
            "Identity of shallow-copied tables didn't match"
        )
    );
  }
}