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

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.pso.bigquery.optimization.analysis.visitors.ExtractScansVisitor.QueryScan;
import com.pso.bigquery.optimization.catalog.BigQueryTableSpec;

import java.util.List;

// Dataclass containing the result of analyzing a BigQuery
// job using the Query Analyzer
public class QueryAnalysisResult {

    private final String query;
    private final List<BigQueryTableSpec> referencedTables;
    private final JsonElement queryStructure;
    private final List<QueryScan> scans;

    public QueryAnalysisResult(
            String query,
            List<BigQueryTableSpec> referencedTables,
            JsonElement queryStructure,
            List<QueryScan> joins
    ) {
        this.query = query;
        this.referencedTables = referencedTables;
        this.queryStructure = queryStructure;
        this.scans = joins;
    }

    public String getQuersy() {
        return query;
    }

    public List<BigQueryTableSpec> getReferencedTables() {
        return referencedTables;
    }

    public JsonElement getQueryStructure() {
        return queryStructure;
    }

    public String getQueryStructureAsString() {
        return new Gson().toJson(this.queryStructure);
    }

    public List<QueryScan> getScans() {
        return scans;
    }

}
