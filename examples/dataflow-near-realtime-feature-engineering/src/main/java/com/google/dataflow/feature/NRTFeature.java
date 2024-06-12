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

package com.google.dataflow.feature;

import org.apache.beam.sdk.extensions.sql.SqlTransform;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.windowing.AfterWatermark;
import org.apache.beam.sdk.transforms.windowing.FixedWindows;
import org.apache.beam.sdk.transforms.windowing.GlobalWindows;
import org.apache.beam.sdk.transforms.windowing.SlidingWindows;
import org.apache.beam.sdk.transforms.windowing.Window;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.Row;
import org.apache.beam.sdk.values.TypeDescriptor;
import org.apache.beam.sdk.values.TypeDescriptors;
import org.joda.time.Duration;

public class NRTFeature<T> extends PTransform<PCollection<Row>, PCollection<KV<String, T>>> {

    TypeDescriptor<T> typeDescriptor;
    private final String key;
    private final String aggregateSql;
    private final Duration slidingWindowSize;
    private final Duration period;
    private final T defaultValue;

    public NRTFeature(
            TypeDescriptor<T> typeDescriptor,
            String key,
            String aggregateSql,
            Duration slidingWindowSize,
            Duration period,
            T defaultValue) {
        this.typeDescriptor = typeDescriptor;
        this.key = key;
        this.aggregateSql = aggregateSql;
        this.slidingWindowSize = slidingWindowSize;
        this.period = period;
        this.defaultValue = defaultValue;
    }

    @Override
    public PCollection<KV<String, T>> expand(PCollection<Row> input) {
        final PCollection<Row> windowed =
                input.apply(
                        "Sliding window",
                        Window.<Row>into(SlidingWindows.of(slidingWindowSize).every(period))
                                .triggering(AfterWatermark.pastEndOfWindow())
                                .withAllowedLateness(Duration.ZERO)
                                .accumulatingFiredPanes());

        final PCollection<Row> sqlResult =
                windowed.apply(
                        "SQL",
                        SqlTransform.query(
                                "select "
                                        + key
                                        + ", "
                                        + aggregateSql
                                        + " as f from PCOLLECTION group by "
                                        + key));
        final PCollection<KV<String, T>> project =
                sqlResult.apply(
                        "Project",
                        MapElements.into(
                                        TypeDescriptors.kvs(
                                                TypeDescriptors.strings(), typeDescriptor))
                                .via(
                                        row ->
                                                KV.of(
                                                        ((Row) row).getString(this.key),
                                                        (T) ((Row) row).getBaseValue("f"))));

        final PCollection<KV<String, T>> feature =
                project.apply(
                                "reset window for stateful processing",
                                Window.into(new GlobalWindows()))
                        .apply("Expire", ParDo.of(new ExpireValue<String, T>(defaultValue)))
                        .apply(
                                "reWindow",
                                Window.<KV<String, T>>into(FixedWindows.of(period))
                                        .triggering(AfterWatermark.pastEndOfWindow())
                                        .withAllowedLateness(Duration.ZERO)
                                        .accumulatingFiredPanes());
        return feature;
    }
}
