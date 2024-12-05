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
package com.google.cloud.pso.benchmarks.redis.serde;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.io.IOException;

/**
 * Provides encoding and decoding functionality for objects of type {@code T}.
 *
 * <p>This interface defines a contract for transforming objects of a specific type into a byte
 * array representation (encoding) and vice versa (decoding). Implementations might use various
 * serialization formats such as JSON or binary.
 *
 * @param <T> The type of object to be encoded and decoded.
 */
public interface EncDecoder<T> {
  /**
   * Encodes the given data object into a byte array.
   *
   * @param data The object to encode.
   * @return A byte array representing the encoded data.
   * @throws JsonProcessingException If an error occurs during the encoding process.
   */
  byte[] encode(T data) throws JsonProcessingException;

  /**
   * Decodes the given byte array into an object of the specified class.
   *
   * @param encodedBytes The byte array representing the encoded data.
   * @param clazz The class of the object to be decoded.
   * @return The decoded object of type {@code T}.
   * @throws IOException If an error occurs during the decoding process.
   */
  T decode(byte[] encodedBytes, Class<T> clazz) throws IOException;
}
