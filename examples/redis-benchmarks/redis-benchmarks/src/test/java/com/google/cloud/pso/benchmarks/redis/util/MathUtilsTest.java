/*
 * Copyright (C) 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.google.cloud.pso.benchmarks.redis.util;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

import org.junit.jupiter.api.Test;

public class MathUtilsTest {
  @Test
  void testGetRandomLong_for_boundedValue() {
    long lowerBound = 2;
    long upperBound = 10;
    long actualValue = MathUtils.getRandomLong(lowerBound, upperBound);
    assertThat(actualValue, greaterThanOrEqualTo(lowerBound));
    assertThat(actualValue, lessThan(upperBound));
  }
}
