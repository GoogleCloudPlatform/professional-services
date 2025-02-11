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

import org.apache.beam.sdk.transforms.SerializableFunction;

/**
 * Returns true for non-empty words. When used with {@link org.apache.beam.sdk.transforms.Filter},
 * empty words are removed from a {@link org.apache.beam.sdk.values.PCollection}.
 */
class FilterNonEmpty implements SerializableFunction<String, Boolean> {

  @Override
  public Boolean apply(String input) {
    return !input.isEmpty();
  }
}
