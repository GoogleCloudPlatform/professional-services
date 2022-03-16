/**
 * Copyright 2022 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.example.dfdl;

import static com.google.cloud.bigtable.data.v2.models.Filters.FILTERS;

import com.google.api.gax.rpc.ServerStream;
import com.google.cloud.bigtable.data.v2.BigtableDataClient;
import com.google.cloud.bigtable.data.v2.BigtableDataSettings;
import com.google.cloud.bigtable.data.v2.models.Filters.Filter;
import com.google.cloud.bigtable.data.v2.models.Query;
import com.google.cloud.bigtable.data.v2.models.Row;
import com.google.cloud.bigtable.data.v2.models.RowCell;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class BigtableService {

  private final BigtableServer bigtableServer;

  @Value("${bigtable.table-id}")
  String tableId;

  public BigtableService(BigtableServer bigtableServer) {
    this.bigtableServer = bigtableServer;
  }

  /**
   * Returns the dfdl definition.
   */
  public DfdlDef getDfdlDef(String name) throws IOException {
    return queryBigtable(name);
  }

  /**
   * Filters and queries Bigtable for the dfdl definition.
   */
  public DfdlDef queryBigtable(String name) throws IOException {
    BigtableDataSettings settings = bigtableServer.getBigtableDataSetting();
    BigtableDataClient bigtableDataClient = bigtableServer.getBigtableClient(settings);
    Filter filterByName = FILTERS
        .chain()
        // Gets specific columns.
        .filter(FILTERS.qualifier().exactMatch("name"))
        .filter(FILTERS.value().exactMatch(name))
        // each output row includes the N most recent cells from each column and omits all other
        // cells from that column.
        .filter(FILTERS.limit().cellsPerColumn(1));
    Query query = Query.create(tableId).filter(filterByName);
    ServerStream<Row> rows = bigtableDataClient.readRows(query);

    for (Row row : rows) {
      Row rowDefinition = bigtableDataClient.readRow(tableId, row.getKey());
      RowCell cellName = rowDefinition.getCells( "dfdl", "name").get(0);
      System.out.printf(
          "Family: %s    Qualifier: %s   Timestamp: %s   Value: %s%n",
          cellName.getFamily(),
          cellName.getQualifier().toStringUtf8(),
          cellName.getTimestamp(),
          cellName.getValue().toStringUtf8());

      RowCell cellDefinition = rowDefinition.getCells("dfdl", "definition").get(0);
      System.out.printf(
          "Family: %s    Qualifier: %s  Timestamp:%s   Value: %s%n",
          cellDefinition.getFamily(),
          cellDefinition.getQualifier().toStringUtf8(),
          cellDefinition.getTimestamp(),
          cellDefinition.getValue().toStringUtf8());
      return buildDfdlDef(cellName, cellDefinition);
    }

    return new DfdlDef();
  }

  private DfdlDef buildDfdlDef (RowCell name, RowCell definition) {
    return new DfdlDef(name.getValue().toStringUtf8(), definition.getValue().toStringUtf8());
  }
}