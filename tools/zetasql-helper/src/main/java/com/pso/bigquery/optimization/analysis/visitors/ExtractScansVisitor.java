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
package com.pso.bigquery.optimization.analysis.visitors;

import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.resolvedast.ResolvedColumn;
import com.google.zetasql.resolvedast.ResolvedNodes.*;
import java.util.*;
import java.util.stream.Collectors;

// Visitor instance that, given the AST, extract the scans the
// query performs on tables. Scans contain the table/view read,
// the columns used in WHERE conditions and the options used in
// JOIN conditions.
public class ExtractScansVisitor extends BaseAnalyzerVisitor {

    public static class TableScan {

        private final String table;
        private final Set<String> filterColumns = new HashSet<>();
        private String joinType = null;
        private final Set<String> joinColumns = new HashSet<>();

        public TableScan(String table) {
            this.table = table;
        }

        public String getTable() {
            return table;
        }

        public Set<String> getFilterColumns() {
            return filterColumns;
        }

        public Optional<String> getJoinType() {
            return Optional.ofNullable(this.joinType);
        }

        public Set<String> getJoinColumns() {
            return joinColumns;
        }

        public void setJoinType(String joinType) {
            this.joinType = joinType;
        }

        public void addFilterColumn(String column) {
            this.filterColumns.add(column);
        }

        public void addJoinColumn(String column) {
            this.joinColumns.add(column);
        }

        public Map<String, Object> toMap() {
            return Map.of(
                    "table", this.table,
                    "filterColumns", this.filterColumns,
                    "joinType", Objects.requireNonNullElse(this.joinType, ""),
                    "joinColumns", this.joinColumns
            );
        }

    }

    public static class QueryScan {

        private final Map<String, TableScan> tableScans = new HashMap<>();

        public List<TableScan> getTableScans() {
            return new ArrayList<>(tableScans.values());
        }

        public void createTableScan(String table) {
            this.tableScans.computeIfAbsent(table, TableScan::new);
        }

        public TableScan getOrCreateTableScan(String table) {
            return this.tableScans.computeIfAbsent(table, TableScan::new);
        }

        public boolean isEmpty() {
            return this.tableScans.isEmpty();
        }

        public Map<String, Object> toMap() {
            List<Map<String, Object>> tableScansAsMaps = this.tableScans
                    .values()
                    .stream()
                    .map(TableScan::toMap)
                    .collect(Collectors.toList());
            return Map.of(
                    "tableScans", tableScansAsMaps
            );
        }

    }

    private final List<QueryScan> queryScans = new ArrayList<>();
    private final Stack<QueryScan> scanStack = new Stack<>();

    public ExtractScansVisitor(String projectId, SimpleCatalog catalog) {
        super(projectId, catalog);
    }

    public List<QueryScan> getResult() {
        return this.queryScans;
    }

    private QueryScan currentScan() {
        // TODO: implement a better way to handle
        //  empty stack errors when there are scans outside
        //  an enclosing ProjectScan.
        if(this.scanStack.empty()) {
            return new QueryScan();
        }

        return this.scanStack.peek();
    }

    private Set<ResolvedColumn> getColumnsFromExpression(ResolvedExpr expr) {
        if(expr instanceof ResolvedColumnRef) {
            return Set.of(((ResolvedColumnRef) expr).getColumn());
        } else if(expr instanceof ResolvedFunctionCallBase) {
            return ((ResolvedFunctionCall) expr).getArgumentList()
                    .stream()
                    .map(this::getColumnsFromExpression)
                    .flatMap(Collection::stream)
                    .collect(Collectors.toSet());
        } else if(expr instanceof ResolvedCast) {
            return this.getColumnsFromExpression(((ResolvedCast) expr).getExpr());
        } else {
            return Set.of();
        }
    }

    public void visit(ResolvedProjectScan scan) {
        this.scanStack.push(new QueryScan());
        super.visit(scan);
        this.queryScans.add(this.scanStack.pop());
    }

    public void visit(ResolvedTableScan tableScan) {
        this.currentScan().createTableScan(tableScan.getTable().getFullName());
    }

    public void visit(ResolvedWithRefScan withRefScan) {
        this.currentScan().createTableScan(withRefScan.getWithQueryName());
    }

    public void visit(ResolvedJoinScan joinScan) {
        ResolvedScan leftScan = joinScan.getLeftScan();
        ResolvedScan rightScan = joinScan.getRightScan();
        leftScan.accept(this);
        rightScan.accept(this);

        Optional<String> rightScanName = rightScan
                .getColumnList()
                .stream()
                .findFirst()
                .map(ResolvedColumn::getTableName);

        rightScanName.ifPresent(s ->
                this.currentScan()
                    .getOrCreateTableScan(s)
                    .setJoinType(joinScan.getJoinType().name())
        );

        Set<ResolvedColumn> joinColumns = this.getColumnsFromExpression(
                joinScan.getJoinExpr()
        );
        for(ResolvedColumn column: joinColumns) {
            this.currentScan()
                    .getOrCreateTableScan(column.getTableName())
                    .addJoinColumn(column.getName());
        }
    }

    public void visit(ResolvedFilterScan filterScan) {
        filterScan.getInputScan().accept(this);
        Set<ResolvedColumn> filterColumns = this.getColumnsFromExpression(
                filterScan.getFilterExpr()
        );
        for(ResolvedColumn column: filterColumns) {
            this.currentScan()
                    .getOrCreateTableScan(column.getTableName())
                    .addFilterColumn(column.getName());
        }
    }

    // CREATE [TEMP|TEMPORARY] TABLE

    @Override
    public void visit(ResolvedCreateTableStmt createTableStmt) {
        super.visit(createTableStmt);
    }


    @Override
    public void visit(ResolvedCreateTableAsSelectStmt createTableAsSelectStmt) {
        super.visit(createTableAsSelectStmt);
        createTableAsSelectStmt.getQuery().accept(this);
    }

    // CREATE [TEMP|TEMPORARY] FUNCTION

    public void visit(ResolvedCreateFunctionStmt createFunctionStmt) {
        super.visit(createFunctionStmt);
    }

}
