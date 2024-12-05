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
package com.google.cloud.pso.benchmarks.redis.model;

/**
 * Represents a generic payload containing a single value.
 *
 * <p>This interface defines a simple contract for holding and retrieving a value of type {@code T}.
 * Implementations may provide additional functionality, such as error handling or metadata
 * associated with the payload.
 *
 * @param <T> The type of the value held within the payload.
 */
public interface Payload<T> {
  /**
   * Retrieves the value contained within this payload.
   *
   * @return The value of type {@code T} stored in the payload.
   */
  T get();
}
