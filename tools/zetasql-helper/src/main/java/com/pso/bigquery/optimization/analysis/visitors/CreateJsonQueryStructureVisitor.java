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

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.resolvedast.ResolvedColumn;
import com.google.zetasql.resolvedast.ResolvedNode;
import com.google.zetasql.resolvedast.ResolvedNodes.*;

import java.util.List;
import java.util.Objects;
import java.util.Stack;
import java.util.stream.Stream;

// Visitor instance that, given the AST, creates a JSON object
// representing the structure of the query.
public class CreateJsonQueryStructureVisitor extends BaseAnalyzerVisitor {

    private final JsonArray result = new JsonArray();
    private final Stack<JsonObject> stack = new Stack<>();

    public CreateJsonQueryStructureVisitor(String projectId, SimpleCatalog catalog) {
        super(projectId, catalog);
    }

    public JsonArray getResult() {
        return this.result;
    }

    public void prepareVisit() {
        this.stack.clear();
        this.stack.push(new JsonObject());
    }

    public void finishVisit() {
        this.result.add(this.stack.pop());
    }

    private JsonElement processChild(ResolvedNode childNode) {
        this.stack.push(new JsonObject());
        childNode.accept(this);
        return this.stack.pop();
    }

    private void register(String key, JsonElement element) {
        this.stack.peek().add(key, element);
    }

    private void register(String key, String element) {
        this.register(key, new JsonPrimitive(element));
    }

    private void register(String key, boolean element) {
        this.register(key, new JsonPrimitive(element));
    }

    private void register(String key, ResolvedNode child) {
        this.register(key, this.processChild(child));
    }

    private void register(String key, List<? extends ResolvedNode> elements) {
        JsonArray jsonArray = new JsonArray();

        elements
                .stream()
                .map(this::processChild)
                .forEach(jsonArray::add);

        this.register(key, jsonArray);
    }

    private void registerNodeKind(ResolvedNode node) {
        this.register("node", node.nodeKindString());
    }

    @SafeVarargs
    private <T> T coalesce(T... items) {
        return Stream.of(items)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    private String formatResolvedColumn(ResolvedColumn resolvedColumn) {
        String[] tableComponents = resolvedColumn.getTableName().split("\\.");
        String tableName = tableComponents[tableComponents.length - 1];
        return String.format(
                "%s.%s", tableName, resolvedColumn.getName()
        );
    }

    @Override
    public void visit(ResolvedQueryStmt queryStmt) {
        this.registerNodeKind(queryStmt);
        this.register("query", queryStmt.getQuery());
    }

    @Override
    public void visit(ResolvedProjectScan scan) {
        this.registerNodeKind(scan);
        this.register("inputScan", scan.getInputScan());
        this.register("expressionList", scan.getExprList());
    }

    @Override
    public void visit(ResolvedJoinScan scan) {
        this.registerNodeKind(scan);
        this.register("joinType", scan.getJoinType().name());
        this.register("leftScan", scan.getLeftScan());
        this.register("rightScan", scan.getRightScan());
        if (scan.getJoinExpr() != null) {
            this.register("joinExpr", scan.getJoinExpr());
        }
    }

    @Override
    public void visit(ResolvedFilterScan scan) {
        this.registerNodeKind(scan);
        this.register("inputScan", scan.getInputScan());
        this.register("filterExpr", scan.getFilterExpr());
    }

    @Override
    public void visit(ResolvedAggregateScan scan) {
        this.registerNodeKind(scan);
        this.register("inputScan", scan.getInputScan());
        this.register("groupByList", scan.getGroupByList());
        this.register("aggregateList", scan.getAggregateList());
    }

    @Override
    public void visit(ResolvedTableScan scan) {
        this.registerNodeKind(scan);
        this.register("table", scan.getTable().getFullName());
    }

    @Override
    public void visit(ResolvedUnpivotScan scan) {
        this.registerNodeKind(scan);
        this.register("inputScan", scan.getInputScan());
    }

    @Override
    public void visit(ResolvedPivotScan scan) {
        this.registerNodeKind(scan);
        this.register("inputScan", scan.getInputScan());
    }

    @Override
    public void visit(ResolvedWithScan scan) {
        this.registerNodeKind(scan);
        this.register("withEntries", scan.getWithEntryList());
        this.register("inputScan", scan.getQuery());
    }

    @Override
    public void visit(ResolvedWithRefScan scan) {
        this.registerNodeKind(scan);
        this.register("entryName", scan.getWithQueryName());
    }

    @Override
    public void visit(ResolvedWithEntry withEntry) {
        this.registerNodeKind(withEntry);
        this.register("entryName", withEntry.getWithQueryName());
        this.register("query", withEntry.getWithSubquery());
    }

    @Override
    public void visit(ResolvedTVFScan scan) {
        this.registerNodeKind(scan);
        this.register("function", scan.getTvf().getFullName());
        this.register("arguments", scan.getArgumentList());
    }

    @Override
    public void visit(ResolvedSampleScan scan) {
        this.registerNodeKind(scan);
        this.register("inputScan", scan.getInputScan());
    }

    @Override
    public void visit(ResolvedAnalyticScan scan) {
        this.registerNodeKind(scan);
        this.register("inputScan", scan.getInputScan());
        this.register("functionGroups", scan.getFunctionGroupList());
    }

    @Override
    public void visit(ResolvedArrayScan scan) {
        super.visit(scan);
    }

    @Override
    public void visit(ResolvedSingleRowScan scan) {
        this.registerNodeKind(scan);
    }

    @Override
    public void visit(ResolvedOutputColumn outputColumn) {
        this.registerNodeKind(outputColumn);
        String column = this.formatResolvedColumn(outputColumn.getColumn());
        this.register("column", column);

    }

    @Override
    public void visit(ResolvedFunctionCall functionCall) {
        this.registerNodeKind(functionCall);
        this.register("function", functionCall.getFunction().getFullName());
        this.register("arguments", functionCall.getArgumentList());
    }

    @Override
    public void visit(ResolvedAggregateFunctionCall aggFunctionCall) {
        this.registerNodeKind(aggFunctionCall);
        this.register("function", aggFunctionCall.getFunction().getFullName());
        this.register("arguments", aggFunctionCall.getArgumentList());
        this.register("distinct", aggFunctionCall.getDistinct());
    }

    @Override
    public void visit(ResolvedAnalyticFunctionGroup analyticFunctionGroup) {
        this.registerNodeKind(analyticFunctionGroup);
        this.register("columns", analyticFunctionGroup.getAnalyticFunctionList());

        if (analyticFunctionGroup.getPartitionBy() != null) {
            JsonArray partitionByColumns = new JsonArray();
            analyticFunctionGroup
                    .getPartitionBy()
                    .getPartitionByList()
                    .stream()
                    .map(ResolvedColumnRef::getColumn)
                    .map(this::formatResolvedColumn)
                    .forEach(partitionByColumns::add);

            this.register("partitionBy", partitionByColumns);
        }

        if (analyticFunctionGroup.getOrderBy() != null) {
            JsonArray orderByColumns = new JsonArray();
            analyticFunctionGroup
                    .getOrderBy()
                    .getOrderByItemList()
                    .stream()
                    .map(ResolvedOrderByItem::getColumnRef)
                    .map(ResolvedColumnRef::getColumn)
                    .map(this::formatResolvedColumn)
                    .forEach(orderByColumns::add);

            this.register("orderBy", orderByColumns);
        }

    }

    @Override
    public void visit(ResolvedAnalyticFunctionCall analyticFunctionCall) {
        this.registerNodeKind(analyticFunctionCall);
        this.register("function", analyticFunctionCall.getFunction().getFullName());
        this.register("arguments", analyticFunctionCall.getArgumentList());
        this.register("distinct", analyticFunctionCall.getDistinct());
    }

    @Override
    public void visit(ResolvedColumnRef columnRef) {
        this.registerNodeKind(columnRef);
        this.register("type", columnRef.getType().toString());
        String column = this.formatResolvedColumn(columnRef.getColumn());
        this.register("column", column);
    }

    @Override
    public void visit(ResolvedComputedColumn computedColumn) {
        this.registerNodeKind(computedColumn);
        String column = this.formatResolvedColumn(computedColumn.getColumn());
        this.register("column", column);
        this.register("expression", computedColumn.getExpr());
    }

    @Override
    public void visit(ResolvedSubqueryExpr subqueryExpr) {
        this.registerNodeKind(subqueryExpr);
        this.register("subqueryType", subqueryExpr.getSubqueryType().name());
        this.register("query", subqueryExpr.getSubquery());
    }

    @Override
    public void visit(ResolvedFunctionArgument functionArgument) {
        // This represents a generic argument to a function. The argument can be
        // semantically an expression, a scan, a model, a connection or a descriptor.
        // Only one of the five fields will be set.
        // We delegate this visit to that node

        ResolvedNode actualArgument = this.coalesce(
                functionArgument.getExpr(),
                functionArgument.getScan(),
                functionArgument.getModel(),
                functionArgument.getConnection(),
                functionArgument.getDescriptorArg()
        );
        actualArgument.accept(this);
    }

    @Override
    public void visit(ResolvedLiteral literal) {
        this.registerNodeKind(literal);
        this.register("type", literal.getType().toString());
    }

    // INSERT

    public void visit(ResolvedInsertStmt insertStmt) {
        this.registerNodeKind(insertStmt);

        if (insertStmt.getQuery() != null) {
            this.register("query", insertStmt.getQuery());
        } else {
            this.register("rows", insertStmt.getRowList());
        }
    }

    public void visit(ResolvedInsertRow insertRow) {
        this.registerNodeKind(insertRow);
        this.register("values", insertRow.getValueList());
    }

    public void visit(ResolvedDMLValue dmlValue) {
        dmlValue.getValue().accept(this);
    }

    // UPDATE

    public void visit(ResolvedUpdateStmt updateStmt) {
        this.registerNodeKind(updateStmt);
        this.register("updateItems", updateStmt.getUpdateItemList());

        if (updateStmt.getWhereExpr() != null) {
            this.register("where", updateStmt.getWhereExpr());
        }
    }

    public void visit(ResolvedUpdateItem updateItem) {
        this.registerNodeKind(updateItem);
        this.register("target", updateItem.getTarget());
        this.register("value", updateItem.getSetValue());
    }

    // MERGE

    public void visit(ResolvedMergeStmt mergeStmt) {
        this.registerNodeKind(mergeStmt);
        this.register("mergeExpr", mergeStmt.getMergeExpr());
        this.register("whenClauses", mergeStmt.getWhenClauseList());
    }

    public void visit(ResolvedMergeWhen mergeWhen) {
        this.registerNodeKind(mergeWhen);
    }

    // CREATE [TEMP|TEMPORARY] TABLE

    @Override
    public void visit(ResolvedCreateTableStmt createTableStmt) {
        super.visit(createTableStmt);

        this.registerNodeKind(createTableStmt);
//        this.register("table", String.join(".", createTableStmt.getNamePath()));
        this.register("columns", createTableStmt.getColumnDefinitionList());

        if (createTableStmt.getPartitionByList() != null) {
            this.register("partitionBy", createTableStmt.getPartitionByList());
        }
    }

    public void visit(ResolvedColumnDefinition columnDefinition) {
        this.registerNodeKind(columnDefinition);
        this.register("column", this.formatResolvedColumn(columnDefinition.getColumn()));
    }

    @Override
    public void visit(ResolvedCreateTableAsSelectStmt createTableAsSelectStmt) {
        super.visit(createTableAsSelectStmt);

        this.registerNodeKind(createTableAsSelectStmt);
        this.register("query", createTableAsSelectStmt.getQuery());

        if (createTableAsSelectStmt.getPartitionByList() != null) {
            this.register("partitionBy", createTableAsSelectStmt.getPartitionByList());
        }
    }

    // CREATE [TEMP|TEMPORARY] FUNCTION

    public void visit(ResolvedCreateFunctionStmt createFunctionStmt) {
        super.visit(createFunctionStmt);

        this.registerNodeKind(createFunctionStmt);
    }

}
