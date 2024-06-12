/*
 *
 *  Copyright (c) 2024  Google LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not
 *  use this file except in compliance with the License. You may obtain a copy of
 *  the License at  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations under
 *  the License.
 */

package com.google.dataflow.feature.pipeline;

import com.google.api.services.bigquery.model.TableRow;
import com.google.dataflow.feature.NRTFeature;
import java.util.Objects;
import java.util.stream.StreamSupport;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO.Write;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO.Write.CreateDisposition;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO.Write.WriteDisposition;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.options.Default;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.Validation;
import org.apache.beam.sdk.schemas.Schema;
import org.apache.beam.sdk.schemas.Schema.Field;
import org.apache.beam.sdk.schemas.Schema.FieldType;
import org.apache.beam.sdk.schemas.transforms.Convert;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.JsonToRow;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.join.CoGbkResult;
import org.apache.beam.sdk.transforms.join.CoGroupByKey;
import org.apache.beam.sdk.transforms.join.KeyedPCollectionTuple;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.Row;
import org.apache.beam.sdk.values.TupleTag;
import org.apache.beam.sdk.values.TypeDescriptors;
import org.joda.time.Duration;
import org.joda.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("serial")
public class TaxiNRTPipeline {

    public interface CustomPipelineOptions extends PipelineOptions {

        @Description("ProjectId where data source topic lives")
        @Default.String("pubsub-public-data")
        @Validation.Required
        String getSourceProject();

        void setSourceProject(String value);

        @Description("TopicId of source topic")
        @Default.String("taxirides-realtime")
        @Validation.Required
        String getSourceTopic();

        void setSourceTopic(String value);

        String getProjectId();

        void setProjectId(String value);

        String getDatasetName();

        void setDatasetName(String value);

        String getTableName();

        void setTableName(String value);
    }

    private static final Logger LOG = LoggerFactory.getLogger(TaxiNRTPipeline.class);

    // ride format from PubSub
    // {
    // "ride_id":"a60ba4d8-1501-4b5b-93ee-b7864304d0e0",
    // "latitude":40.66684000000033,
    // "longitude":-73.83933000000202,
    // "timestamp":"2016-08-31T11:04:02.025396463-04:00",
    // "meter_reading":14.270274,
    // "meter_increment":0.019336415,
    // "ride_status":"enroute",
    // "passenger_count":2
    // }

    public static class BuildTableRow extends DoFn<KV<String, CoGbkResult>, TableRow> {

        public static final TupleTag<Float> T1 = new TupleTag<>();
        public static final TupleTag<Long> T2 = new TupleTag<>();

        @ProcessElement
        public void processElement(ProcessContext c, @Timestamp Instant ts) {
            KV<String, CoGbkResult> e = c.element();
            CoGbkResult result = e.getValue();
            // Retrieve all integers associated with this key from pt1
            Iterable<Float> allF1 = result.getAll(T1);
            Iterable<Long> allF2 = result.getAll(T2);

            Float f1 =
                    StreamSupport.stream(allF1.spliterator(), false)
                            .filter(Objects::nonNull)
                            .findFirst()
                            .orElse(0.0f);
            Long f2 =
                    StreamSupport.stream(allF2.spliterator(), false)
                            .filter(Objects::nonNull)
                            .findFirst()
                            .orElse(0L);

            String id = e.getKey();
            c.output(
                    new TableRow()
                            .set("entity_id", id)
                            .set("meter_increment_in_last_90s", f1)
                            .set("max_passenger_count_in_last_60s", f2)
                            .set("feature_timestamp", ts.toString()));
        }
    }

    public static void main(String[] args) {
        CustomPipelineOptions options =
                PipelineOptionsFactory.fromArgs(args)
                        .withValidation()
                        .as(CustomPipelineOptions.class);
        Pipeline p = Pipeline.create(options);

        PCollection<String> input =
                p.apply(
                        PubsubIO.readStrings()
                                .fromTopic(
                                        String.format(
                                                "projects/%s/topics/%s",
                                                options.getSourceProject(),
                                                options.getSourceTopic()))
                                .withTimestampAttribute("ts"));
        Schema schema =
                Schema.of(
                        Field.of("ride_id", FieldType.STRING),
                        Field.of("latitude", FieldType.DOUBLE),
                        Field.of("longitude", FieldType.DOUBLE),
                        Field.of("timestamp", FieldType.STRING),
                        Field.of("meter_reading", FieldType.DOUBLE),
                        Field.of("meter_increment", FieldType.DOUBLE),
                        Field.of("ride_status", FieldType.STRING),
                        Field.of("passenger_count", FieldType.INT64));
        final PCollection<Row> apply =
                input.apply("Parse", JsonToRow.withSchema(schema)).apply("toRow", Convert.toRows());

        final PCollection<KV<String, Float>> f1Rewindow =
                apply.apply(
                        "meter",
                        new NRTFeature<>(
                                TypeDescriptors.floats(),
                                "ride_id",
                                "cast(sum(meter_increment) as float)",
                                Duration.standardSeconds(90),
                                Duration.standardSeconds(30),
                                0.0f));

        final PCollection<KV<String, Long>> f2Rewindow =
                apply.apply(
                        "passengers",
                        new NRTFeature<>(
                                TypeDescriptors.longs(),
                                "ride_id",
                                "max(passenger_count)",
                                Duration.standardSeconds(60),
                                Duration.standardSeconds(30),
                                0L));
        final TupleTag<Float> t1 = BuildTableRow.T1;
        final TupleTag<Long> t2 = BuildTableRow.T2;
        PCollection<KV<String, CoGbkResult>> result =
                KeyedPCollectionTuple.of(t1, f1Rewindow)
                        .and(t2, f2Rewindow)
                        .apply(CoGroupByKey.create());

        final PCollection<TableRow> rows = result.apply("build Row", ParDo.of(new BuildTableRow()));

        rows.apply(
                BigQueryIO.<TableRow>write()
                        .to(
                                String.format(
                                        "%s:%s.%s",
                                        options.getProjectId(),
                                        options.getDatasetName(),
                                        options.getTableName()))
                        .withCreateDisposition(CreateDisposition.CREATE_NEVER)
                        .withFormatFunction(tr -> tr)
                        .withWriteDisposition(WriteDisposition.WRITE_APPEND)
                        .withMethod(Write.Method.STORAGE_API_AT_LEAST_ONCE));
        p.run();
    }
}
