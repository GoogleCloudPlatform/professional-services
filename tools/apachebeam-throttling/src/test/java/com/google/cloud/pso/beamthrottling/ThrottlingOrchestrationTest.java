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

package com.google.cloud.pso.dataflowthrottling;

import java.io.Serializable;
import java.util.Arrays;
import java.util.List;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.StringUtf8Coder;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.TypeDescriptor;
import org.junit.Rule;
import org.junit.Test;

/**
 * Here clientCall is defined as it supposed to reject the payload 7, 8 from WORDS_ARRAY.
 * Once com.google.cloud.pso.dataflowthrottling.DynamicThrottlingTransform processes the pipeline, successTag will return all from WORDS_ARRAY except 7, 8.
 * And PAssert validates the output PCollection is as same as expected.
 */
public class ThrottlingOrchestrationTest implements Serializable {
    // Our static input data, which will make up the initial PCollection.
    static final String[] WORDS_ARRAY = new String[]{
            "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",};

    static final List<String> WORDS = Arrays.asList(WORDS_ARRAY);
    @Rule
    public TestPipeline p = TestPipeline.create().enableAbandonedNodeEnforcement(false);

    @Test
    public void testClass() {
        DynamicThrottlingTransform.ClientCall<String, String> clientCall = csvLine -> {
            int csvLine1 = Integer.parseInt(csvLine);
            if (csvLine1 > 5 && csvLine1 < 9) {
                throw new ThrottlingException("Server returned HTTP response code: 429");
            }
            return csvLine;
        };

        Coder<String> strCoder = StringUtf8Coder.of();

        // Create an input PCollection.
        //TestStream<String> stream = TestStream.<String>create(StringUtf8Coder.of()).addElements("1", "2", "3", "4", "5", "6", "7", "8", "9", "10").advanceWatermarkToInfinity();
        //PCollection<String> input = p.apply(stream).apply(Window.into(new GlobalWindows()));

        //TODO implement test for streaming collection: Current version of DynamicThrottling uses different versions of timer deoending on bag collection type.
        //When it is set to PROCESSING_TIME for UNBOUNDED [Streaming PCOllection], integration-test doesn't pass because it doesn't see events in the output collection.

        PCollection<String> input = p.apply(Create.of(WORDS)).setCoder(StringUtf8Coder.of());

        DynamicThrottlingTransform<String, String> dynamicThrottlingTransform = new DynamicThrottlingTransform.Builder<String, String>(clientCall, StringUtf8Coder.of(), 5000)
                .withKInRejectionProbability(2).withNumberOfGroups(1).withBatchInterval(java.time.Duration.ofSeconds(1)).withResetCounterInterval(java.time.Duration.ofMinutes(1)).withThrottlingStrategy(ThrottlingStrategy.DLQ).build();
        PCollectionTuple transform = input.apply(dynamicThrottlingTransform);
        PCollection<String> output = transform.get(dynamicThrottlingTransform.getSuccessTag()).setCoder(strCoder).apply("transform", MapElements.into(TypeDescriptor.of(String.class)).via((String csvLine) -> csvLine));
        PAssert.that(output)
                .containsInAnyOrder(
                        "1", "2", "3", "4", "5", "9", "10");
        // Run the pipeline.
        p.run();
    }

}
