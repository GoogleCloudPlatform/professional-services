package com.google.pso.zetasql.helper.catalog.spanner;

import com.google.zetasql.SimpleTable;
import java.util.List;

public interface SpannerResourceProvider {

  List<SimpleTable> getTables(List<String> tableNames);

  List<SimpleTable> getAllTablesInDatabase();

}
