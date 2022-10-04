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
package com.pso.bigquery.optimization;

import com.google.zetasql.Analyzer;
import com.google.zetasql.ParseResumeLocation;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedStatement;
import com.pso.bigquery.optimization.analysis.QueryAnalyzer;
import com.pso.bigquery.optimization.analysis.QueryAnalyzer.CatalogScope;
import com.pso.bigquery.optimization.analysis.visitors.ExtractScansVisitor;
import com.pso.bigquery.optimization.analysis.visitors.ExtractScansVisitor.QueryScan;
import com.pso.bigquery.optimization.catalog.CatalogUtils;
import io.vavr.control.Try;
import java.util.List;

public class BuildCatalogForProjectAndAnalyzeJoins {


    public static void main(String[] args) throws InterruptedException {
        String PROJECT_ID = "MY_PROJECT";
        // add a query that references actual tables in your projets
        String QUERY = "SELECT \n"
            + "  t1.col1 \n"
            + "FROM \n"
            + "  `MY_PROJECT.MY_DATASET.test_table_1` t1\n"
            + "LEFT JOIN\n"
            + "  `MY_PROJECT.MY_DATASET.test_table_2` t2 ON t1.unique_key=t2.unique_key\n"
            + "WHERE\n"
            + " t1.col2 is not null\n"
            + " AND t2.col2 is not null\n";

        // Create Catalog and add all datasets in a project
        SimpleCatalog catalog = CatalogUtils.createCatalogForProject(PROJECT_ID);

        // setup ZetatSQL
        QueryAnalyzer parser = new QueryAnalyzer();
        Try<List<QueryScan>> tryScans = parser.getScansInQuery(PROJECT_ID, QUERY, catalog, CatalogScope.PROJECT);
        List<ExtractScansVisitor.QueryScan> scanResults = tryScans.get();

        scanResults.stream()
            .map(ExtractScansVisitor.QueryScan::toMap)
            .forEach(scanResult -> System.out.println(scanResult));
    }

}
