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

import com.google.api.services.bigquery.model.TableRow;
import com.google.cloud.pso.bigquery.TableRowWithSchema;
import com.google.common.flogger.FluentLogger;
import java.util.List;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryInsertError;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollectionView;

/**
 * A transform to get the {@link TableRow row's} schema.
 * <br/><br/>
 * Note, if <b>not</b> able to get the schema, the row will be ignored/lost.
 */
public class FailedInsertToTableRowWithSchema extends DoFn<BigQueryInsertError, KV<String, TableRowWithSchema>> {

    private static final FluentLogger LOGGER = FluentLogger.forEnclosingClass();

    private final PCollectionView<List<TableRowWithSchema>> incomingRecordsView;

    /**
     * Creates an instance.
     *
     * @param incomingRecordsView A map containing the {@link TableRowWithSchema schema} for each row
     */
    public FailedInsertToTableRowWithSchema(
            PCollectionView<List<TableRowWithSchema>> incomingRecordsView) {
        this.incomingRecordsView = incomingRecordsView;
    }

    @ProcessElement
    public void processElement(ProcessContext context) {
        BigQueryInsertError failedInsert = context.element();
        TableRowWithSchema tableRowWithSchema = null;
        List<TableRowWithSchema> tableRowsWithSchema = context.sideInput(incomingRecordsView);
        for (TableRowWithSchema rowWithSchema : tableRowsWithSchema) {
            if (rowWithSchema.getTableRow().equals(failedInsert.getRow())) {
                tableRowWithSchema = rowWithSchema;
            }
        }
        LOGGER.atInfo().log("Row With Error  " + failedInsert.getError());
        if (tableRowWithSchema == null) {
            LOGGER.atSevere().log("Unable to retrieve schema for failed insert: %s", failedInsert.getRow());
        } else {
            LOGGER.atInfo().log("Found failed insert: %s", tableRowWithSchema);
            context.output(KV.of(failedInsert.getError().toString(), tableRowWithSchema));
        }
    }
}

