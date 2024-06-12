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

import java.util.Objects;
import java.util.stream.StreamSupport;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.join.CoGbkResult;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.TupleTag;
import org.joda.time.Instant;

public class MergeFeaturesToCSV extends DoFn<KV<String, CoGbkResult>, String> {

    public static final TupleTag<Long> T1 = new TupleTag<>();
    public static final TupleTag<Long> T2 = new TupleTag<>();

    @ProcessElement
    public void processElement(ProcessContext c, @Timestamp Instant ts) {
        KV<String, CoGbkResult> e = c.element();
        CoGbkResult result = e.getValue();
        Iterable<Long> allF1 = result.getAll(T1);
        Iterable<Long> allF2 = result.getAll(T2);

        Long f1 =
                StreamSupport.stream(allF1.spliterator(), false)
                        .filter(Objects::nonNull)
                        .findFirst()
                        .orElse(null);
        Long f2 =
                StreamSupport.stream(allF2.spliterator(), false)
                        .filter(Objects::nonNull)
                        .findFirst()
                        .orElse(null);

        String personId = e.getKey();
        c.output(personId + "," + f1 + "," + f2 + "," + ts.toString());
    }
}
