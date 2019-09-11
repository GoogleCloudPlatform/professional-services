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
import com.google.cloud.pso.coder.GenericJsonCoder;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.coders.CoderException;
import org.apache.beam.sdk.coders.CoderRegistry;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;
import org.apache.beam.sdk.values.TypeDescriptor;

/**
 * Needed because TableRow is not serializable and may have nulls which will cause exceptions when
 * using AvroCoder since the nullable fields are not annotated with Avro's @Nullable annotation.
 *
 * <p>https://stackoverflow.com/questions/33383632/how-can-i-specify-define-a-coder-for-a-class-that-wraps-tablerow
 */
public class TableRowWithSchemaCoder extends CustomCoder<TableRowWithSchema> {

    // Coders for the member types
    private static final StringUtf8Coder TABLE_NAME_CODER = StringUtf8Coder.of();
    private static final GenericJsonCoder<TableSchema> TABLE_SCHEMA_CODER =
            GenericJsonCoder.of(TableSchema.class);
    private static final GenericJsonCoder<TableRow> TABLE_ROW_CODER =
            GenericJsonCoder.of(TableRow.class);

    // Singleton instances
    private static final TableRowWithSchemaCoder INSTANCE = new TableRowWithSchemaCoder();
    private static final TypeDescriptor<TableRowWithSchema> TYPE_DESCRIPTOR =
            new TypeDescriptor<TableRowWithSchema>() {
            };

    /**
     * Retrieves the {@link TableRowWithSchemaCoder} instance.
     *
     * @return The singleton instance.
     */
    public static TableRowWithSchemaCoder of() {
        return INSTANCE;
    }

    /**
     * Registers the coder in the pipeline's registry so {@link TableRowWithSchema} objects can be
     * automatically inferred.
     *
     * @param pipeline The pipeline to register the coder on.
     */
    public static void registerCoder(Pipeline pipeline) {
        TableRowWithSchemaCoder coder = TableRowWithSchemaCoder.of();

        CoderRegistry coderRegistry = pipeline.getCoderRegistry();
        coderRegistry.registerCoderForType(coder.getEncodedTypeDescriptor(), coder);
    }

    @Override
    public void encode(TableRowWithSchema value, OutputStream outStream) throws IOException {
        if (value == null) {
            throw new CoderException("The TableRowWithSchemaCoder cannot encode a null object!");
        }

        TABLE_NAME_CODER.encode(value.getTableName(), outStream);
        TABLE_SCHEMA_CODER.encode(value.getTableSchema(), outStream);
        TABLE_ROW_CODER.encode(value.getTableRow(), outStream);
    }

    @Override
    public TableRowWithSchema decode(InputStream inStream) throws CoderException, IOException {

        String tableName = TABLE_NAME_CODER.decode(inStream);
        TableSchema tableSchema = TABLE_SCHEMA_CODER.decode(inStream);
        TableRow tableRow = TABLE_ROW_CODER.decode(inStream);

        return TableRowWithSchema.newBuilder()
                .setTableName(tableName)
                .setTableSchema(tableSchema)
                .setTableRow(tableRow)
                .build();
    }

    @Override
    public TypeDescriptor<TableRowWithSchema> getEncodedTypeDescriptor() {
        return TYPE_DESCRIPTOR;
    }
}
