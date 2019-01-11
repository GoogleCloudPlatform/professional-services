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

import com.fasterxml.jackson.core.JsonPointer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import com.google.auto.value.AutoValue;
import com.google.common.base.Throwables;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.TupleTag;
import org.apache.beam.sdk.values.TupleTagList;
import java.io.IOException;

import static com.google.common.base.Preconditions.checkArgument;

/**
 * A {@link PTransform} that validates a {@link PCollection<String>} and performs the following
 * validation: 1. The string is a well formed json document. 2. The well formed json document
 * contains key element specified as a json pointer The PTransform returns a {@link
 * PCollectionTuple} tagged with the {@link TupleTag} provided.
 */
@AutoValue
public abstract class FailSafeValidate extends PTransform<PCollection<String>, PCollectionTuple> {

  public static Builder newBuilder() {
    return new AutoValue_FailSafeValidate.Builder().setObjectReader((new ObjectMapper()).reader());
  }

  abstract TupleTag<KV<String, String>> successTag();

  abstract TupleTag<ErrorMessage> failureTag();

  abstract ObjectReader objectReader();

  abstract ExtractKeyFn extractKeyFn();

  @Override
  public PCollectionTuple expand(PCollection<String> input) {
    return input.apply(
        "ValidateAndTagMessages",
        ParDo.of(
                new DoFn<String, KV<String, String>>() {
                  @ProcessElement
                  public void processElement(ProcessContext context) {
                    String input = context.element();

                    try {
                      JsonNode jsonNode = objectReader().readTree(input);

                      String key = null;

                      try {
                        key = extractKeyFn().apply(jsonNode);

                      } catch (RuntimeException e) {
                        ErrorMessage em =
                            ErrorMessage.newBuilder()
                                .withJsonPayload(input)
                                .withErrorMessage("Missing key element")
                                .build();
                        context.output(failureTag(), em);
                      }

                      if (key != null) {
                        context.output(successTag(), KV.of(key, input));
                      }

                    } catch (IOException e) {
                      ErrorMessage em =
                          ErrorMessage.newBuilder()
                              .withJsonPayload(input)
                              .withErrorMessage("Invalid Json message")
                              .withErrorStackTrace(Throwables.getStackTraceAsString(e))
                              .build();

                      context.output(failureTag(), em);
                    }
                  }
                })
            .withOutputTags(successTag(), TupleTagList.of(failureTag())));
  }

  @AutoValue.Builder
  public abstract static class Builder {
    abstract Builder setSuccessTag(TupleTag<KV<String, String>> successTag);

    abstract Builder setFailureTag(TupleTag<ErrorMessage> failureTag);

    abstract Builder setObjectReader(ObjectReader objectReader);

    abstract Builder setExtractKeyFn(ExtractKeyFn extractKeyFn);

    public abstract FailSafeValidate build();

    public Builder withKeyPath(String keyPath) {
      checkArgument(keyPath != null, "withKeyPath(keyPath) called with null value.");
      try {
        JsonPointer.compile(keyPath);
      } catch (IllegalArgumentException e) {
        throw new RuntimeException(e);
      }
      return setExtractKeyFn(new ExtractKeyFn(keyPath));
    }

    public Builder withSuccessTag(TupleTag<KV<String, String>> successTag) {
      checkArgument(successTag != null, "withSuccessTag(successTag) called with null value.");
      return setSuccessTag(successTag);
    }

    public Builder withFailureTag(TupleTag<ErrorMessage> failureTag) {
      checkArgument(failureTag != null, "withFailureTag(failureTag) called with null value.");
      return setFailureTag(failureTag);
    }
  }
}
