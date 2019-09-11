/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.google.cloud.pso.dataflow.transform;

import static com.google.common.base.Preconditions.checkNotNull;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.Field.Mode;
import com.google.cloud.bigquery.FieldList;
import com.google.cloud.bigquery.LegacySQLTypeName;
import com.google.cloud.bigquery.Schema;
import com.google.cloud.bigquery.Table;
import com.google.cloud.bigquery.TableDefinition;
import com.google.cloud.bigquery.TableId;
import com.google.cloud.pso.bigquery.TableRowWithSchema;
import com.google.cloud.pso.dataflow.options.StreamToBigQueryPipelineOptions;
import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import com.google.common.flogger.FluentLogger;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

/**
 * The {@link TableRowWithSchema} mutator.
 */
public class TableRowSchemaMutator extends DoFn<KV<String, TableRowWithSchema>, KV<String, TableRowWithSchema>> {


    private static final FluentLogger LOGGER = FluentLogger.forEnclosingClass();

    private transient BigQuery bigQuery;

    public TableRowSchemaMutator(BigQuery bigQuery) {
        this.bigQuery = bigQuery;
    }

    @Setup
    public void setup() throws IOException {
        if (bigQuery == null) {
            bigQuery = BigQueryOptions.newBuilder()
                    .setCredentials(GoogleCredentials.getApplicationDefault())
                    .build()
                    .getService();
        }
    }

    /**
     *
     * @param context
     */
    @ProcessElement
    public void processElement(ProcessContext context) {
        final StreamToBigQueryPipelineOptions options = context
                .getPipelineOptions()
                .as(StreamToBigQueryPipelineOptions.class);

        TableRowWithSchema mutatedRow = context.element().getValue();

        // Retrieve the table schema.
        TableId tableId = TableId.of(options.getProject(), options.getBqDataset().get(), options.getBqTable().get());
        Table table = bigQuery.getTable(tableId);

        checkNotNull(table, "Failed to find table to mutate: " + tableId.toString());

        TableDefinition tableDef = table.getDefinition();
        Schema schema = tableDef.getSchema();

        checkNotNull(schema, "Unable to retrieve schema for table: " + tableId.toString());

        LOGGER.atInfo().log("Actual table schema: %s", schema);

        // Compare the records to the known table schema.
        Set<Field> additionalFields = getAdditionalFields(schema, mutatedRow);

        LOGGER.atInfo().log("Additional fields: %s", additionalFields);

        // Update the table schema for the new fields.
        schema = addFieldsToSchema(schema, additionalFields);
        table.toBuilder().setDefinition(tableDef.toBuilder().setSchema(schema).build()).build().update();

        // Pass all rows downstream now that the schema of the output table has been mutated.
        LOGGER.atInfo().log("mutatedRow: %s", mutatedRow);
        context.output(
                KV.of(context.element().getKey(), mutatedRow));
        LOGGER.atInfo().log(additionalFields.toString());
    }

    /**
     * Retrieves the fields which have been added to the schema across all of the mutated rows.
     *
     * @param schema     The schema to validate against.
     * @param mutatedRow The records which have mutated.
     * @return A unique set of fields which have been added to the schema.
     */
    private Set<Field> getAdditionalFields(Schema schema, TableRowWithSchema mutatedRow) {

        // Compare the existingSchema to the mutated rows.
        final FieldList fieldList = schema.getFields();
        Set<Field> additionalFields = Sets.newHashSet();
        for (Object field : mutatedRow.getTableSchema().getFields()) {
            final String fieldName = Objects.toString(((Map) field).get("name"));
            final String fieldType = Objects.toString(((Map) field).get("type"));
            if (!isExistingField(fieldList, fieldName)) {
                additionalFields.add(
                        Field.of(fieldName, LegacySQLTypeName.valueOf(fieldType))
                                .toBuilder()
                                .setMode(Mode.NULLABLE)
                                .build());
            }
        }
        return additionalFields;
    }

    /**
     * Checks whether the field name exists within the field list.
     *
     * @param fieldList The field list to validate the field against.
     * @param fieldName The field to check for.
     * @return True if the fieldName exists within the field list, false otherwise.
     */
    private boolean isExistingField(FieldList fieldList, String fieldName) {
        try {
            fieldList.get(fieldName);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Adds additional fields to an existing schema and returns a new schema containing all existing
     * and additional fields.
     *
     * @param schema           The pre-existing schema to add fields to.
     * @param additionalFields The new fields to be added to the schema.
     * @return A new schema containing the existing and new fields added to the schema.
     */
    private Schema addFieldsToSchema(Schema schema, Set<Field> additionalFields) {
        List<Field> newFieldList = Lists.newArrayList();

        // Add the existing fields to the schema fields.
        newFieldList.addAll(schema.getFields());

        // Add all new fields to the schema fields.
        newFieldList.addAll(additionalFields);

        return Schema.of(newFieldList);
    }
}
