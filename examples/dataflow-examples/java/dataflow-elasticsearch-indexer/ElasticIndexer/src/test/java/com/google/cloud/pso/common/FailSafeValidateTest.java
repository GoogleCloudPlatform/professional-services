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

import com.google.cloud.pso.coders.ErrorMessageCoder;
import org.apache.beam.sdk.testing.NeedsRunner;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.SerializableFunction;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.TupleTag;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

import static com.google.common.truth.Truth.assertThat;

/** Test class for {@link FailSafeValidate} */
@RunWith(JUnit4.class)
public class FailSafeValidateTest {

  private static final String VALID_JSON = "{ \"sku\": 123 }";
  private static final String MALFORMED_JSON = "{ \"sku\": 666 ";
  private static final String INCORRECT_KEY_JSON = "{ \"xyz\": 123 }";

  private static final String KEY_PATH = "/sku";
  private static final TupleTag<KV<String, String>> SUCCESS_TAG =
      new TupleTag<KV<String, String>>() {};
  private static final TupleTag<ErrorMessage> FAILURE_TAG = new TupleTag<ErrorMessage>() {};

  private static final ErrorMessage MALFORMED_ERROR_MESSAGE =
      ErrorMessage.newBuilder()
          .withJsonPayload(MALFORMED_JSON)
          .withErrorMessage("Invalid Json message")
          .build();

  private static final ErrorMessage INCORRECT_KEY_ERROR_MESSAGE =
      ErrorMessage.newBuilder()
          .withJsonPayload(INCORRECT_KEY_JSON)
          .withErrorMessage("Missing key element")
          .build();

  @Rule public final transient TestPipeline pipeline = TestPipeline.create();

  @Before
  public void setup() {
    pipeline.getCoderRegistry().registerCoderForClass(ErrorMessage.class, ErrorMessageCoder.of());
  }

  @Test
  @Category(NeedsRunner.class)
  public void failSafeMessagesAreCorrectlyTaggedTest() {

    FailSafeValidate transform =
        FailSafeValidate.newBuilder()
            .withSuccessTag(SUCCESS_TAG)
            .withFailureTag(FAILURE_TAG)
            .withKeyPath(KEY_PATH)
            .build();

    PCollectionTuple tuple = pipeline.apply(Create.of(VALID_JSON, MALFORMED_JSON)).apply(transform);

    PCollection<KV<String, String>> successActual = tuple.get(SUCCESS_TAG);
    PCollection<ErrorMessage> failureActual = tuple.get(FAILURE_TAG);

    PAssert.thatSingleton(successActual).isEqualTo(KV.of("123", VALID_JSON));
    PAssert.thatSingleton(failureActual).satisfies(new MalformedErrorMessageCheckFn());

    pipeline.run();
  }

  @Test
  @Category(NeedsRunner.class)
  public void onlyBadMessagesTest() {

    FailSafeValidate transform =
        FailSafeValidate.newBuilder()
            .withSuccessTag(SUCCESS_TAG)
            .withFailureTag(FAILURE_TAG)
            .withKeyPath(KEY_PATH)
            .build();

    PCollectionTuple tuple = pipeline.apply(Create.of(MALFORMED_JSON)).apply(transform);

    PCollection<KV<String, String>> successActual = tuple.get(SUCCESS_TAG);
    PCollection<ErrorMessage> failureActual = tuple.get(FAILURE_TAG);

    PAssert.that(successActual).empty();
    PAssert.thatSingleton(failureActual).satisfies(new MalformedErrorMessageCheckFn());

    pipeline.run();
  }

  @Test
  @Category(NeedsRunner.class)
  public void incorrectKeyTest() {

    FailSafeValidate transform =
        FailSafeValidate.newBuilder()
            .withSuccessTag(SUCCESS_TAG)
            .withFailureTag(FAILURE_TAG)
            .withKeyPath("/incorrect")
            .build();

    PCollectionTuple tuple = pipeline.apply(Create.of(INCORRECT_KEY_JSON)).apply(transform);

    PCollection<KV<String, String>> successActual = tuple.get(SUCCESS_TAG);
    PCollection<ErrorMessage> failureActual = tuple.get(FAILURE_TAG);

    PAssert.that(successActual).empty();
    PAssert.thatSingleton(failureActual).isEqualTo(INCORRECT_KEY_ERROR_MESSAGE);

    pipeline.run();
  }

  private static class MalformedErrorMessageCheckFn
      implements SerializableFunction<ErrorMessage, Void> {

    @Override
    public Void apply(ErrorMessage input) {

      assertThat(input.jsonPayload()).isEqualTo(MALFORMED_ERROR_MESSAGE.jsonPayload());
      assertThat(input.errorMessage()).isEqualTo(MALFORMED_ERROR_MESSAGE.errorMessage());
      assertThat(input.errorStackTrace())
          .contains("com.fasterxml.jackson.core.io.JsonEOFException");
      return null;
    }
  }
}
