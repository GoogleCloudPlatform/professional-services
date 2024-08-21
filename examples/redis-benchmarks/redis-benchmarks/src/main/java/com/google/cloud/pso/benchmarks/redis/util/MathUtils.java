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

/** Utility class for performing various mathematical operations. */
public class MathUtils {
  /**
   * Private constructor to prevent instantiation. This class is designed to be a static utility
   * class, so it cannot be instantiated.
   */
  private MathUtils() {}

  /**
   * Generates a pseudo-random long integer within a specified range.
   *
   * <p>The generated value will be inclusive of the lower bound and exclusive of the upper bound.
   *
   * @param lowerBound the inclusive lower bound of the random number
   * @param upperBound the exclusive upper bound of the random number
   * @return a random long integer between lowerBound (inclusive) and upperBound (exclusive)
   * @throws IllegalArgumentException if lowerBound is greater than upperBound
   */
  public static long getRandomLong(long lowerBound, long upperBound) {
    if (lowerBound > upperBound) {
      throw new IllegalArgumentException("lowerBound must be less than or equal to upperBound");
    }

    long range = upperBound - lowerBound; // Calculate the range (exclusive upperbound)
    return Math.round(Math.random() * range) + lowerBound;
  }
}
