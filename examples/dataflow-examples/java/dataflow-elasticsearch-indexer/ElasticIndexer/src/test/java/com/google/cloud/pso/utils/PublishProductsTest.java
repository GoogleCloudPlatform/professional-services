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

package com.google.cloud.pso.utils;

import static com.google.common.truth.Truth.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.bigtable.v2.Mutation;
import com.google.cloud.pso.coders.JsonNodeCoder;
import com.google.protobuf.ByteString;
import java.io.IOException;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.testing.NeedsRunner;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.Keys;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Test class for {@link PublishProducts} */
@RunWith(JUnit4.class)
public class PublishProductsTest {

  private static final String TEST_JSON = "{ \"sku\": 123 }";
  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final String COLUMN_FAMILY = "cf";
  private static final String COLUMN_QUALIFIER = "in_stock";

  private static final PublishProducts.PublishProductsOptions options =
      TestPipeline.testingPipelineOptions().as(PublishProducts.PublishProductsOptions.class);
  @Rule public final transient TestPipeline pipeline = TestPipeline.create();
  private JsonNode testJsonNode;

  @Before
  public void setup() throws IOException {
    testJsonNode = MAPPER.reader().readTree(TEST_JSON);
  }

  @Test
  @Category(NeedsRunner.class)
  public void testIncorrectIdKey() {
    String invalidKey = "/invalid_key";
    PCollection<KV<ByteString, Iterable<Mutation>>> pc =
        pipeline
            .apply(Create.of(testJsonNode).withCoder(JsonNodeCoder.of()))
            .apply(
                ParDo.of(
                    new PublishProducts.JsonNodeToMutationFn(
                        COLUMN_FAMILY, COLUMN_QUALIFIER, invalidKey)));

    // Check key
    PCollection<ByteString> keys = pc.apply(Keys.create());

    Pipeline.PipelineExecutionException thrown =
        assertThrows(
            Pipeline.PipelineExecutionException.class,
            () -> {
              PAssert.thatSingleton(keys).isEqualTo(ByteString.copyFromUtf8(Long.toString(123)));
              pipeline.run(options);
            });

    assertThat(thrown).hasCauseThat().isInstanceOf(RuntimeException.class);
    assertThat(thrown).hasMessageThat().contains("Missing id key: " + invalidKey);
  }
}
