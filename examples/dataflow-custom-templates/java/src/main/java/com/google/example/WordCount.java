/*
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package com.google.example;

import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.TextIO;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.Count;
import org.apache.beam.sdk.transforms.Filter;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.MapElements;

/**
 * Count words read from a file blob.
 *
 * <p>See {@link WordCountOptions} for a list of expected arguments.
 */
public class WordCount {

  public static void main(String[] args) {
    WordCountOptions options =
        PipelineOptionsFactory.fromArgs(args).withValidation().as(WordCountOptions.class);

    Pipeline p = Pipeline.create(options);

    p.apply("ReadFromSource", TextIO.read().from(options.getSource()))
        .apply("SplitLinesIntoTokens", FlatMapElements.via(split()))
        .apply("FilterNonEmptyTokens", Filter.by(filterNonEmpty()))
        .apply("ConvertToLowerCase", MapElements.via(toLowerCase()))
        .apply("CountPerToken", Count.perElement())
        .apply("FormatCountsToDisplay", MapElements.via(displayCounts()))
        .apply("OutputResult", TextIO.write().to(options.getOutput()));

    p.run();
  }

  static DisplayCounts displayCounts() {
    return new DisplayCounts();
  }

  static FilterNonEmpty filterNonEmpty() {
    return new FilterNonEmpty();
  }

  static SplitString split() {
    return new SplitString();
  }

  static ToLowerCase toLowerCase() {
    return new ToLowerCase();
  }
}
