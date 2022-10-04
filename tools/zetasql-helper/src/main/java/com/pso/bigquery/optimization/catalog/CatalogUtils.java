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

import com.google.api.gax.paging.Page;
import com.google.api.gax.rpc.FixedHeaderProvider;
import com.google.api.gax.rpc.HeaderProvider;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.Dataset;
import com.google.cloud.bigquery.Table;
import com.google.common.collect.ImmutableMap;
import com.google.zetasql.*;

import com.pso.bigquery.optimization.exceptions.CatalogDuplicateDatasetNameException;
import java.util.List;
import java.util.Optional;

// Utility class for working with ZetaSQL catalogs on BigQuery
public class CatalogUtils {

    private static final String USER_AGENT_HEADER = "user-agent";
    private static final String USER_AGENT_VALUE = "google-pso-tool/zetasql-helper/0.0.1";

    // Creates an empty catalog and returns it.
    // It adds ZetaSQL built-in functions and BigQuery aliases for types.
    public static SimpleCatalog createEmptyCatalog() {
        SimpleCatalog catalog = new SimpleCatalog("catalog");

        // Add built-in functions
        catalog.addZetaSQLFunctions(new ZetaSQLBuiltinFunctionOptions());

        // Add BigQuery-specific type aliases
        catalog.addType("INT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64));
        catalog.addType("SMALLINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64));
        catalog.addType("INTEGER", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64));
        catalog.addType("BIGINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64));
        catalog.addType("TINYINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64));
        catalog.addType("BYTEINT", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_INT64));
        catalog.addType("DECIMAL", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_NUMERIC));
        catalog.addType("BIGDECIMAL", TypeFactory.createSimpleType(ZetaSQLType.TypeKind.TYPE_BIGNUMERIC));

        return catalog;
    }

    // Get a child catalog from an existing catalog, creating it if it does not exist
    private static SimpleCatalog getOrCreateNestedCatalog(SimpleCatalog parent, String name) {
        Optional<SimpleCatalog> maybeExistingCatalog = parent
            .getCatalogList()
            .stream()
            .filter(catalog -> catalog.getFullName().equals(name))
            .findFirst();

        try {
            if (maybeExistingCatalog.isEmpty()) {
                SimpleCatalog newCatalog = new SimpleCatalog(name);
                parent.addSimpleCatalog(newCatalog);
                return newCatalog;
            }
        } catch (IllegalArgumentException e) {
            if(e.getMessage().contains("duplicate key")){
                throw new CatalogDuplicateDatasetNameException(String.format("There seems to be two datasets with the same name but different casing for: %s.\nZetaSQL is case insensitive, a catalog cannot have two datasets with the same name and different casing.",name));
            }
        }
        return maybeExistingCatalog.get();
    }

    // Add a SimpleTable to a SimpleCatalog.
    // If the table is already present in the Catalog, it will be updated.
    private static void addTableToCatalog(
            SimpleCatalog catalog,
            SimpleTable table
    ) {
        if(catalog.getTable(table.getName(), null) != null) {
            catalog.removeSimpleTable(table);
        }

        catalog.addSimpleTable(table);
    }

    // Add a SimpleTable to a SimpleCatalog.
    // If the table is already present in the Catalog, it will be updated.
    public static void createTableInCatalog(
            SimpleCatalog catalog,
            String tableName,
            List<SimpleColumn> columns
    ) {
        CatalogUtils.addTableToCatalog(
                catalog,
                new SimpleTable(tableName, columns)
        );
    }

    // Creates a table in a catalog.
    // This will create the tables multiple times to account for
    // how ZetaSQL resolves table references.
    // For context, I recommend reading: https://github.com/google/zetasql/issues/108#issuecomment-1128139006
    public static void createTableInCatalog(
            SimpleCatalog catalog,
            String projectId,
            String datasetId,
            String tableName,
            List<SimpleColumn> columns
    ) {
        // Create the table, including all variants
        //  The variants are:
        //      * Top level table with full name (catches `project.dataset.table`)
        //      * Top level table without project id (catches `dataset.table`)
        //      * Nested table with full path (catches project.dataset.table, no quotes)
        //      * Nested table without project (catches dataset.table, no quotes)
        //      * Nested table with project and dataset merged (catches `project.dataset`.table, notice quotes)

        String fullTableName = String.format("%s.%s.%s", projectId, datasetId, tableName);
        String tableNameWithDataset = String.format("%s.%s", datasetId, tableName);
        String datasetWithProjectId = String.format("%s.%s", projectId, datasetId);

        SimpleTable tableWithFullName = new SimpleTable(fullTableName, columns);
        SimpleTable tableWithNameAndDataset = new SimpleTable(tableNameWithDataset, columns);
        SimpleTable tableWithRegularName = new SimpleTable(tableName, columns);

        tableWithNameAndDataset.setFullName(fullTableName);
        tableWithRegularName.setFullName(fullTableName);

        CatalogUtils.addTableToCatalog(catalog, tableWithFullName);
        CatalogUtils.addTableToCatalog(catalog, tableWithNameAndDataset);

        SimpleCatalog project = CatalogUtils.getOrCreateNestedCatalog(catalog, projectId);
        SimpleCatalog inProjectDataset = CatalogUtils.getOrCreateNestedCatalog(project, datasetId);
        SimpleCatalog topLevelDataset = CatalogUtils.getOrCreateNestedCatalog(catalog, datasetId);
        SimpleCatalog datasetWithProject = CatalogUtils.getOrCreateNestedCatalog(catalog, datasetWithProjectId);

        CatalogUtils.addTableToCatalog(inProjectDataset, tableWithRegularName);
        CatalogUtils.addTableToCatalog(topLevelDataset, tableWithRegularName);
        CatalogUtils.addTableToCatalog(datasetWithProject, tableWithRegularName);
    }

    private static void addFunctionToCatalog(
            SimpleCatalog catalog,
            List<String> namePath,
            String group,
            ZetaSQLFunctions.FunctionEnums.Mode mode,
            FunctionSignature signature
    ) {
        // NOTE: this assumes functions added to a catalog this way
        //  only have one signature.
        //  As of May 2022, BigQuery does not support UDFs having
        //  multiple signatures. Because of that, we don't need to handle
        //  multiple signatures existing; at least for now.

        Function function = new Function(
                namePath, group, mode, List.of(signature)
        );

        if(catalog.getFunctionByFullName(function.getFullName()) != null) {
            catalog.removeFunction(function);
        }

        catalog.addFunction(function);
    }

    // Creates a function in a SimpleCatalog
    public static void createFunctionInCatalog(
            SimpleCatalog catalog,
            List<String> namePath,
            String group,
            ZetaSQLFunctions.FunctionEnums.Mode mode,
            FunctionSignature signature
    ) {
        String joinedNamePath = String.join(".", namePath);

        CatalogUtils.addFunctionToCatalog(
                catalog,
                List.of(joinedNamePath),
                group,
                mode,
                signature
        );

        if(namePath.size() > 1) {
            String nestedCatalogName = namePath.get(0);
            SimpleCatalog nestedCatalog = CatalogUtils.getOrCreateNestedCatalog(
                    catalog, nestedCatalogName
            );

            List<String> nestedNamePath = namePath.subList(1, namePath.size());
            CatalogUtils.createFunctionInCatalog(
                    nestedCatalog,
                    nestedNamePath,
                    group,
                    mode,
                    signature
            );
        }
    }

    public static SimpleCatalog createCatalogForProject(String projectId) {
        SimpleCatalog catalog = CatalogUtils.createEmptyCatalog();
        addProjectToCatalog(projectId, catalog);
        return catalog;
    }

    public static void addProjectToCatalog(String projectId, SimpleCatalog catalog) {
        HeaderProvider headerProvider =
            FixedHeaderProvider.create(
                ImmutableMap.of(USER_AGENT_HEADER, USER_AGENT_VALUE));

        BigQuery bigquery =
            BigQueryOptions.newBuilder().setHeaderProvider(headerProvider).build().getService();

        Page<Dataset> datasetListPage =  bigquery.listDatasets(projectId);
        Iterable<Dataset> datasetList = null;

        do {
            datasetList = datasetListPage.getValues();
            datasetList.forEach(dataset -> addDatasetToCatalog(dataset, catalog));
            datasetListPage = datasetListPage.getNextPage();

        } while (datasetListPage != null);
    }

    private static void addDatasetToCatalog(Dataset dataset, SimpleCatalog catalog) {
        Page<com.google.cloud.bigquery.Table> tableListPage = dataset.list();
        Iterable<com.google.cloud.bigquery.Table> tableList = null;
        do {
            tableList = tableListPage.getValues();
            tableList.forEach(table -> addTableToCatalog(table, catalog));
            tableListPage = tableListPage.getNextPage();

        } while (tableListPage != null);

    }

    private static void addTableToCatalog(Table table, SimpleCatalog catalog) {
        table = table.reload();
        CatalogUtils.createTableInCatalog(
            catalog,
            table.getTableId().getProject(),
            table.getTableId().getDataset(),
            table.getTableId().getTable(),
            BigQuerySchemaConverter.extractTableColumns(table)
        );
    }

    private CatalogUtils() {}
}
