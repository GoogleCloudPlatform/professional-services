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

import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.StandardSQLTypeName;
import com.google.cloud.bigquery.Table;
import com.google.zetasql.SimpleColumn;
import com.google.zetasql.StructType.StructField;
import com.google.zetasql.Type;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLType.TypeKind;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

// Utility class for converting BigQuery API
// schemas into ZetaSQL-compatible schemas
public class BigQuerySchemaConverter {

    // Given a BigQuery API Table object, return a list of
    // ita columns in as ZetaSQL SimpleColumns.
    public static List<SimpleColumn> extractTableColumns(Table table) {
        BigQueryTableSpec tableSpec = BigQueryTableSpec.fromTable(table);
        List<SimpleColumn> columns = table
                .getDefinition()
                .getSchema()
                .getFields()
                .stream()
                .map(field -> BigQuerySchemaConverter.createSimpleColumn(tableSpec, field))
                .collect(Collectors.toList());

        return columns;
    }

    // Create a ZetaSQL SimpleColumn from a BigQuery API table Field
    // for a particular table.
    private static SimpleColumn createSimpleColumn(BigQueryTableSpec tableSpec, Field field) {
        return new SimpleColumn(
                tableSpec.getStdTablePath(),
                field.getName(),
                BigQuerySchemaConverter.extractColumnType(field)
        );
    }

    // Returns the ZetaSQL type corresponding to the type of a BigQuery API
    // table field
    // It support both structs and repeated fields
    private static Type extractColumnType(Field field) {
        Type fieldType;
        StandardSQLTypeName type = field.getType().getStandardType();
        Field.Mode mode = Optional.ofNullable(field.getMode()).orElse(Field.Mode.NULLABLE);

        if (type.equals(StandardSQLTypeName.STRUCT)) {
            List<StructField> fields = field
                    .getSubFields()
                    .stream()
                    .map(subField -> {
                        Type recordFieldType = BigQuerySchemaConverter.extractColumnType(subField);
                        return new StructField(subField.getName(), recordFieldType);
                    })
                    .collect(Collectors.toList());

            fieldType = TypeFactory.createStructType(fields);
        } else {
            fieldType = TypeFactory.createSimpleType(
                    BigQuerySchemaConverter.convertSimpleType(type)
            );
        }

        if (mode.equals(Field.Mode.REPEATED)) {
            return TypeFactory.createArrayType(fieldType);
        }

        return fieldType;
    }

    // Returns the corresponding ZetaSQL TypeKind given a BigQuery API
    // type name
    private static TypeKind convertSimpleType(StandardSQLTypeName bqType) {
        switch (bqType) {
            case STRING:
                return TypeKind.TYPE_STRING;
            case BYTES:
                return TypeKind.TYPE_BYTES;
            case INT64:
                return TypeKind.TYPE_INT64;
            case FLOAT64:
                return TypeKind.TYPE_FLOAT;
            case NUMERIC:
                return TypeKind.TYPE_NUMERIC;
            case BIGNUMERIC:
                return TypeKind.TYPE_BIGNUMERIC;
            case INTERVAL:
                return TypeKind.TYPE_INTERVAL;
            case BOOL:
                return TypeKind.TYPE_BOOL;
            case TIMESTAMP:
                return TypeKind.TYPE_TIMESTAMP;
            case DATE:
                return TypeKind.TYPE_DATE;
            case TIME:
                return TypeKind.TYPE_TIME;
            case DATETIME:
                return TypeKind.TYPE_DATETIME;
            case GEOGRAPHY:
                return TypeKind.TYPE_GEOGRAPHY;
            default:
                return TypeKind.TYPE_UNKNOWN;
        }
    }

}
