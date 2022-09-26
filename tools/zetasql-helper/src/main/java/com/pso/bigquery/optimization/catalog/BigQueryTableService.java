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
package com.pso.bigquery.optimization.catalog;

import com.google.api.gax.rpc.FixedHeaderProvider;
import com.google.api.gax.rpc.HeaderProvider;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.Table;
import com.google.cloud.bigquery.TableId;
import com.google.common.collect.ImmutableMap;
import com.pso.bigquery.optimization.exceptions.TableNotFound;
import io.vavr.control.Try;

import java.util.*;

// Service for getting tables from the BigQuery API
// It caches tables internally, so subsequent requests for the same table don't hit the API
public class BigQueryTableService {

    private final BigQuery client;
    private final Map<String, Table> cachedTables = new HashMap<>();
    private static final String USER_AGENT_HEADER = "user-agent";
    private static final String USER_AGENT_VALUE = "google-pso-tool/zetasql-helper/0.0.1";

    public BigQueryTableService(BigQuery client) {
        this.client = client;
    }

    public static BigQueryTableService buildDefault() {
        HeaderProvider headerProvider =
            FixedHeaderProvider.create(
                ImmutableMap.of(USER_AGENT_HEADER, USER_AGENT_VALUE));

        BigQuery bigquery =
            BigQueryOptions.newBuilder().setHeaderProvider(headerProvider).build().getService();

        return new BigQueryTableService(
            bigquery
        );
    }

    // Fetches a BigQuery table from the API, given it's table spec
    private Try<Table> getBQTableFromAPI(BigQueryTableSpec tableSpec) {
        TableId tableRef = TableId.of(
                tableSpec.getProjectId(),
                tableSpec.getDatasetId(),
                tableSpec.getTableName()
        );

        return Try.of(() -> this.client.getTable(tableRef))
                .flatMap(table ->
                        table != null
                            ? Try.success(table)
                            : Try.failure(
                                    new TableNotFound(tableSpec)
                            )
                );
    }

    // Gets a BQ table given its project ID and table ID.
    // It caches tables so that consequent requests for the same table
    // will not hit the API.
    public Try<Table> getBQTable(String projectId, String tableId) {
        return BigQueryTableParser
                .fromTableId(projectId, tableId)
                .map(tableSpec ->
                        this.cachedTables.computeIfAbsent(
                            tableSpec.getStdTablePath(),
                            key -> this.getBQTableFromAPI(tableSpec).get()
                        )
                );
    }

}
