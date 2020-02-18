/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.demo.dataflow;

import com.demo.dataflow.eventfn.ParseGoBikeEvents;
import com.demo.dataflow.model.FailedMessage;
import com.demo.dataflow.model.GoBike;
import com.demo.dataflow.util.TableSchemaUtils;
import com.google.api.services.bigquery.model.TableReference;
import com.google.api.services.bigquery.model.TableRow;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.TextIO;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class GoBikeToBigQuery  {
    static final Logger LOG = LoggerFactory.getLogger(GoBikeToBigQuery.class);

    public static void main(String[] args) throws Exception {
        PipelineOptionsFactory.register(GoBikeAppPipelineOptions.class);
        GoBikeAppPipelineOptions customOptions = PipelineOptionsFactory.fromArgs(args)
                .as(GoBikeAppPipelineOptions.class);
        String projectId = customOptions.getProject();
        String dataSetId = customOptions.getDataset().toString();
        String bqTableName = customOptions.getTableName().toString();
        String filePattern = customOptions.getInputFilePattern().toString();
        Pipeline pipeline = Pipeline.create(customOptions);
        TableReference bqTable = getTableReference(projectId, dataSetId, bqTableName);
        TableReference bqTableError = getTableReference(projectId, dataSetId, bqTableName + "Err");

        PCollection<String> rawLinesFromGCS = pipeline.apply(
                "Read Raw File",
                TextIO.read().from(filePattern)
        );
        PCollectionTuple parsedGoBikeCollection = ParseGoBikeEvents.process(rawLinesFromGCS);

        PCollection<GoBike> validGoBikeCollection = parsedGoBikeCollection.get(ParseGoBikeEvents.successTag);
        PCollection<FailedMessage> invalidGoBikeCollection = parsedGoBikeCollection.get(ParseGoBikeEvents.deadLetterTag);


        validGoBikeCollection.apply("Records in BQ", ParDo.of(new PDCDatatoBQ()))
                .apply("Write To BigQuery", BigQueryIO.writeTableRows().to(bqTable).withSchema(TableSchemaUtils.readSchema("/gobikeschema.json"))
                        .withCreateDisposition(BigQueryIO.Write.CreateDisposition.CREATE_IF_NEEDED)
                        .withWriteDisposition(BigQueryIO.Write.WriteDisposition.WRITE_APPEND).withoutValidation());
        /**
         * Writing the errored records in BQ. Stack driver will only have the correlationId and the error message
         */
        invalidGoBikeCollection.apply("Record Invalid Records in BQ", ParDo.of(new PDCErrorDatatoBQ()))
                .apply("Write To Failed to BigQuery(Err table)", BigQueryIO.writeTableRows().to(bqTableError).withSchema(TableSchemaUtils.readSchema("/failedmessage.json"))
                        .withCreateDisposition(BigQueryIO.Write.CreateDisposition.CREATE_IF_NEEDED)
                        .withWriteDisposition(BigQueryIO.Write.WriteDisposition.WRITE_APPEND).withoutValidation());



        pipeline.run();
    }

    public static TableReference getTableReference(String projectId, String dataSetId, String bqTableName) {
        TableReference table = new TableReference();
        table.setProjectId(projectId);
        table.setDatasetId(dataSetId);
        table.setTableId(bqTableName);
        return table;
    }

    static class PDCErrorDatatoBQ extends DoFn<FailedMessage, TableRow> {
        @DoFn.ProcessElement
        public void processElement(ProcessContext c) {
            FailedMessage data = (FailedMessage) c.element();
            TableRow tableRow = new TableRow();
            tableRow.set("correlation_id", data.getCorelationId());
            tableRow.set("data_string", data.getDataString());
            tableRow.set("error_message", data.getErrorMessage());
            tableRow.set("error_timestamp", data.getTimestamp());
            c.output(tableRow);
        }
    }

    static class PDCDatatoBQ extends DoFn<GoBike, TableRow> {
        @ProcessElement
        public void processElement(ProcessContext c) {
            GoBike event = (GoBike) c.element();
            TableRow row = new TableRow()
                    .set("duration_sec", event.getDurationSec())
                    .set("start_time", event.getStartTime())
                    .set("end_time", event.getEndTime())
                    .set("start_station_id", event.getStartStationId())
                    .set("start_station_name", event.getStartStationName())
                    .set("start_station", "POINT(" + event.getStartStationLongitude() + " " + event.getStartStationLatitude() + ")")
                    .set("end_station_id", event.getEndStationId())
                    .set("end_station_name", event.getEndStationName())
                    .set("end_station", "POINT(" + event.getEndStationLongitude() + " " + event.getEndStationLatitude() + ")")
                    .set("bike_id", event.getBikerId())
                    .set("user_type", event.getUserType())
                    .set("member_birth_year", event.getMemberBirthYear())
                    .set("member_gender", event.getMemberGender())
                    .set("bike_share_for_all_trip", event.getBikeShareForAllTrip());
            c.output(row);
        }
    }
}
