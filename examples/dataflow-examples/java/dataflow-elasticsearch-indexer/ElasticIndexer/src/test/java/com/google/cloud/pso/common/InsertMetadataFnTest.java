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

package com.google.cloud.pso.common;

import com.google.common.collect.ImmutableList;
import org.apache.beam.sdk.testing.NeedsRunner;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.junit.Rule;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** Test class for {@link InsertMetadataFn} */
@RunWith(JUnit4.class)
public class InsertMetadataFnTest {
  private static final String TEST_JSON_1 = "{ \"sku\": 123}";
  private static final String TEST_JSON_2 = "{ \"sku\": 124}";
  private static final String EXPECTED_JSON_TRUE = "{\"sku\":123,\"available\":true}";
  private static final String EXPECTED_JSON_FALSE = "{\"sku\":124,\"available\":false}";
  private static final String NEW_FIELD = "available";

  @Rule public final transient TestPipeline pipeline = TestPipeline.create();

  @Test
  @Category(NeedsRunner.class)
  public void testJsonWithValidField() {

    PCollection<String> actual =
        pipeline
            .apply(Create.of(KV.of(TEST_JSON_1, true), KV.of(TEST_JSON_2, false)))
            .apply(ParDo.of(new InsertMetadataFn(NEW_FIELD)));

    PAssert.that(actual)
        .containsInAnyOrder(ImmutableList.of(EXPECTED_JSON_TRUE, EXPECTED_JSON_FALSE));
    pipeline.run();
  }
}
