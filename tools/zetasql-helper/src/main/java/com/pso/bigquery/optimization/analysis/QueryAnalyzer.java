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
package com.pso.bigquery.optimization.analysis;

import com.google.cloud.bigquery.Table;
import com.google.gson.JsonElement;
import com.google.zetasql.*;
import com.google.zetasql.resolvedast.ResolvedNodes.*;
import com.pso.bigquery.optimization.analysis.visitors.CreateJsonQueryStructureVisitor;
import com.pso.bigquery.optimization.analysis.visitors.ExtractScansVisitor;
import com.pso.bigquery.optimization.analysis.visitors.ExtractScansVisitor.QueryScan;
import com.pso.bigquery.optimization.catalog.BigQuerySchemaConverter;
import com.pso.bigquery.optimization.catalog.BigQueryTableParser;
import com.pso.bigquery.optimization.catalog.BigQueryTableService;
import com.pso.bigquery.optimization.catalog.BigQueryTableSpec;
import com.pso.bigquery.optimization.catalog.CatalogUtils;
import com.pso.bigquery.optimization.catalog.*;
import io.vavr.collection.Seq;
import io.vavr.control.Try;
import org.apache.commons.lang3.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

// The QueryAnalyzer parses a BigQuery job using ZetaSQL and
// extracts information from it.
// It returns a QueryAnalysisResult with findings if the job
// is successfully parsed with ZetaSQL.
public class QueryAnalyzer {

    private final BigQueryTableService bqTableService;

    public QueryAnalyzer() {
        this.bqTableService = null;
    }

    public QueryAnalyzer(BigQueryTableService bqTableService) {
        this.bqTableService = bqTableService;
    }

    public AnalyzerOptions getAnalyzerOptions() {
        LanguageOptions languageOptions = new LanguageOptions()
                .enableMaximumLanguageFeatures();
        languageOptions.setSupportsAllStatementKinds();

        AnalyzerOptions analyzerOptions = new AnalyzerOptions();
        analyzerOptions.setLanguageOptions(languageOptions);
        analyzerOptions.setCreateNewColumnForEachProjectedOutput(true);
        return analyzerOptions;
    }

    private Try<List<Table>> extractReferencedTables(
            String projectId, String query
    ) {
        return Try.of(() ->
                        Analyzer
                                .extractTableNamesFromScript(query, this.getAnalyzerOptions())
                                .stream()
                                .map(tablePath -> String.join(".", tablePath))
                                .distinct()
                                .filter(BigQueryTableParser::isValidTableId)
                                .map(tableId -> this.bqTableService.getBQTable(projectId, tableId))
                                .collect(Collectors.toList())
                )
                .flatMap(Try::sequence)
                .map(Seq::asJava);
    }

    // Extracts the reference tables from a SQL query and adds them to a catalog
    // Remember that, in order to analyze a query, all its referenced tables need
    // to exist in the catalog.
    private Try<Void> updateCatalogFromSQL(
            String projectId,
            String query,
            SimpleCatalog catalog
    ) {
        Try<List<Table>> tryReferencedTables = this.extractReferencedTables(projectId, query);

        if (tryReferencedTables.isFailure()) {
            return Try.failure(tryReferencedTables.getCause());
        }

        for (Table table : tryReferencedTables.get()) {
            CatalogUtils.createTableInCatalog(
                    catalog,
                    table.getTableId().getProject(),
                    table.getTableId().getDataset(),
                    table.getTableId().getTable(),
                    BigQuerySchemaConverter.extractTableColumns(table)
            );
        }

        return Try.success(null);
    }

    public Try<JsonElement> parseQueryIntoJsonObject(String projectId, String query) {
        SimpleCatalog catalog = CatalogUtils.createEmptyCatalog();

        ParseResumeLocation parseResumeLocation = new ParseResumeLocation(query);
        CreateJsonQueryStructureVisitor visitor = new CreateJsonQueryStructureVisitor(projectId, catalog);

        Try<Void> tryUpdateCatalog = this.updateCatalogFromSQL(
                projectId, query, catalog
        );

        if (tryUpdateCatalog.isFailure()) {
            return Try.failure(tryUpdateCatalog.getCause());
        }

        while (ParsingUtils.hasNextStatement(parseResumeLocation)) {
            Try<ResolvedStatement> tryParsedStatement = Try.of(() ->
                    Analyzer.analyzeNextStatement(
                            parseResumeLocation, this.getAnalyzerOptions(), catalog
                    )
            );

            if (tryParsedStatement.isFailure()) {
                return Try.failure(tryParsedStatement.getCause());
            }

            tryParsedStatement.forEach(resolvedStatement -> {
                visitor.prepareVisit();
                resolvedStatement.accept(visitor);
                visitor.finishVisit();
            });
        }

        return Try.success(visitor.getResult());
    }

    public Try<List<QueryScan>> getScansInQuery(String projectId, String query) {
        SimpleCatalog catalog = CatalogUtils.createEmptyCatalog();

        ParseResumeLocation parseResumeLocation = new ParseResumeLocation(query);
        ExtractScansVisitor visitor = new ExtractScansVisitor(projectId, catalog);

        Try<Void> tryUpdateCatalog = this.updateCatalogFromSQL(
                projectId, query, catalog
        );

        if (tryUpdateCatalog.isFailure()) {
            return Try.failure(tryUpdateCatalog.getCause());
        }

        while (ParsingUtils.hasNextStatement(parseResumeLocation)) {
            Try<ResolvedStatement> tryParsedStatement = Try.of(() ->
                    Analyzer.analyzeNextStatement(
                            parseResumeLocation, this.getAnalyzerOptions(), catalog
                    )
            );

            if (tryParsedStatement.isFailure()) {
                return Try.failure(tryParsedStatement.getCause());
            }

            tryParsedStatement.forEach(resolvedStatement -> {
                resolvedStatement.accept(visitor);
            });
        }

        return Try.success(visitor.getResult());
    }

    private String removeBeginEndFromQuery(String query) {
        // Not ideal, but having redundant BEGIN and END statements
        // is a common pattern for and ZetaSQL does not support it.
        return StringUtils.removeStart(
                StringUtils.removeEnd(
                        query.trim(),
                        "END;"
                ),
                "BEGIN"
        );
    }

    // Performs the analysis on a BigQuery job in the context of a project ID.
    // The project ID should be the project where the job was run.
    public Try<QueryAnalysisResult> runAnalysis(String projectId, String query) {
        // 1. Extract referenced tables from the job
        Try<List<BigQueryTableSpec>> tryReferencedTables = this.extractReferencedTables(projectId, query)
                .map(tables ->
                        tables
                                .stream()
                                .map(BigQueryTableParser::fromTable)
                                .collect(Collectors.toList())
                );

        if(tryReferencedTables.isFailure()) {
            return Try.failure(tryReferencedTables.getCause());
        }

        // 2. Generate the query structure JSON object based on the query
        Try<JsonElement> tryJsonQueryStructure = this.parseQueryIntoJsonObject(projectId, query);

        if(tryJsonQueryStructure.isFailure()) {
            return Try.failure(tryJsonQueryStructure.getCause());
        }

        // 3. Extract the scans performed by the query
        Try<List<ExtractScansVisitor.QueryScan>> tryScans = this.getScansInQuery(projectId, query);

        if(tryScans.isFailure()) {
            return Try.failure(tryScans.getCause());
        }

        // 4. Gather the results in a QueryAnalysisResult
        QueryAnalysisResult result = new QueryAnalysisResult(
                query,
                tryReferencedTables.get(),
                tryJsonQueryStructure.get(),
                tryScans.get()
        );

        return Try.success(result);
    }

}
