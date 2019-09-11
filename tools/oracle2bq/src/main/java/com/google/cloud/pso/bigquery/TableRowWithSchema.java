/*
 * Copyright (C) 2018 Google Inc.
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

package com.google.cloud.pso.bigquery;

import com.google.api.services.bigquery.model.TableRow;
import com.google.api.services.bigquery.model.TableSchema;

/**
 * The {@link TableRowWithSchema} class provides a wrapper around a {@link TableRow} to maintain
 * additional metadata information about the table to which the row belongs and that table's schema.
 * <p>
 * TODO: Convert to AutoValue when a coder for AutoValue types exists within Beam.
 */
public final class TableRowWithSchema {

    private final String tableName;
    private final TableSchema tableSchema;
    private final TableRow tableRow;

    // Private empty-arg constructor for Avro reflection.
    private TableRowWithSchema() {
        tableName = null;
        tableSchema = null;
        tableRow = null;
    }

    public TableRowWithSchema(
            String tableName,
            TableSchema tableSchema,
            TableRow tableRow) {
        this.tableName = tableName;
        this.tableSchema = tableSchema;
        this.tableRow = tableRow;
    }

    public String getTableName() {
        return tableName;
    }

    public TableSchema getTableSchema() {
        return tableSchema;
    }

    public TableRow getTableRow() {
        return tableRow;
    }

    public static Builder newBuilder() {
        return new Builder();
    }

    @Override
    public String toString() {
        return "TableRowWithSchema{"
                + "tableName=" + tableName + ", "
                + "tableSchema=" + tableSchema + ", "
                + "tableRow=" + tableRow
                + "}";
    }

    @Override
    public boolean equals(Object o) {
        if (o == this) {
            return true;
        }
        if (o instanceof TableRowWithSchema) {
            TableRowWithSchema that = (TableRowWithSchema) o;
            return (this.tableName.equals(that.getTableName()))
                    && (this.tableSchema.equals(that.getTableSchema()))
                    && (this.tableRow.equals(that.getTableRow()));
        }
        return false;
    }

    @Override
    public int hashCode() {
        int h = 1;
        h *= 1000003;
        h ^= this.tableName.hashCode();
        h *= 1000003;
        h ^= this.tableSchema.hashCode();
        h *= 1000003;
        h ^= this.tableRow.hashCode();
        return h;
    }

    public TableRowWithSchema.Builder toBuilder() {
        return new TableRowWithSchema.Builder(this);
    }

    /**
     * The builder for {@link TableRowWithSchema} objects.
     */
    public static final class Builder {
        private String tableName;
        private TableSchema tableSchema;
        private TableRow tableRow;

        Builder() {
        }

        private Builder(TableRowWithSchema source) {
            this.tableName = source.getTableName();
            this.tableSchema = source.getTableSchema();
            this.tableRow = source.getTableRow();
        }

        public TableRowWithSchema.Builder setTableName(String tableName) {
            if (tableName == null) {
                throw new NullPointerException("Null tableName");
            }
            this.tableName = tableName;
            return this;
        }

        public TableRowWithSchema.Builder setTableSchema(TableSchema tableSchema) {
            if (tableSchema == null) {
                throw new NullPointerException("Null tableSchema");
            }
            this.tableSchema = tableSchema;
            return this;
        }

        public TableRowWithSchema.Builder setTableRow(TableRow tableRow) {
            if (tableRow == null) {
                throw new NullPointerException("Null tableRow");
            }
            this.tableRow = tableRow;
            return this;
        }

        public TableRowWithSchema build() {
            String missing = "";
            if (this.tableName == null) {
                missing += " tableName";
            }
            if (this.tableSchema == null) {
                missing += " tableSchema";
            }
            if (this.tableRow == null) {
                missing += " tableRow";
            }
            if (!missing.isEmpty()) {
                throw new IllegalStateException("Missing required properties:" + missing);
            }
            return new TableRowWithSchema(
                    this.tableName,
                    this.tableSchema,
                    this.tableRow);
        }
    }
}
