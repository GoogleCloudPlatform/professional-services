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
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import org.msgpack.jackson.dataformat.MessagePackMapper;

/**
 * Implementation of the {@link EncDecoder} interface using MessagePack for serialization.
 *
 * <p>This class provides methods to encode and decode objects of type {@code T} into MessagePack
 * format, a binary serialization format known for its efficiency and compactness.
 *
 * @param <T> The type of object to be encoded and decoded.
 */
public class MessagePack<T> implements EncDecoder<T> {
  /** The ObjectMapper instance for handling MessagePack serialization. */
  private final ObjectMapper objectMapper = new MessagePackMapper(); // New approach

  /**
   * Encodes the given data object into a MessagePack byte array.
   *
   * @param message The object to encode.
   * @return A byte array representing the MessagePack-encoded data.
   * @throws JsonProcessingException If an error occurs during the encoding process (e.g., invalid
   *     object structure).
   */
  @Override
  public byte[] encode(T message) throws JsonProcessingException {
    return objectMapper.writeValueAsBytes(message);
  }

  /**
   * Decodes the given MessagePack byte array into an object of the specified class.
   *
   * @param encodedBytes The byte array containing the MessagePack-encoded data.
   * @param clazz The class of the object to be decoded.
   * @return The decoded object of type {@code T}.
   * @throws IOException If an error occurs during the decoding process (e.g., invalid MessagePack
   *     data).
   */
  @Override
  public T decode(byte[] encodedBytes, Class<T> clazz) throws IOException {
    return objectMapper.readValue(encodedBytes, clazz);
  }
}
