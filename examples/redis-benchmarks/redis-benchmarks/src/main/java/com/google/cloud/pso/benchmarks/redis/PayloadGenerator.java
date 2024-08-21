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
package com.google.cloud.pso.benchmarks.redis;

import com.google.cloud.pso.benchmarks.redis.compression.Compression;
import com.google.cloud.pso.benchmarks.redis.model.Payload;
import com.google.cloud.pso.benchmarks.redis.serde.EncDecoder;
import java.io.IOException;

/**
 * A generator class for creating and managing payloads of type {@code T}.
 *
 * <p>This class encapsulates the processes of encoding, compressing, decompressing, and decoding
 * payloads using the provided {@link EncDecoder} and {@link Compression} implementations.
 *
 * @param <T> The type of object encapsulated within the payload.
 */
public class PayloadGenerator<T> {
  private final EncDecoder<T> encoderDecoder;
  private final Compression compressor;
  private final Payload<T> payload;
  private final Class<T> payloadClass;

  /**
   * Constructs a PayloadGenerator with the specified encoder/decoder, compression algorithm, sample
   * payload, and class.
   *
   * @param encoderDecoder The {@link EncDecoder} implementation for encoding and decoding.
   * @param compressor The {@link Compression} implementation for compression and decompression.
   * @param payload A sample payload object used as a template.
   * @param clazz The class object representing the type {@code T} of the payload.
   */
  public PayloadGenerator(
      EncDecoder<T> encoderDecoder, Compression compressor, Payload<T> payload, Class<T> clazz) {
    this.encoderDecoder = encoderDecoder;
    this.compressor = compressor;
    this.payload = payload;
    this.payloadClass = clazz;
  }

  /**
   * Generates a byte array representation of the payload, after encoding and compression.
   *
   * @return A byte array containing the encoded and compressed payload data.
   * @throws RuntimeException If an IOException occurs during encoding or compression.
   */
  public byte[] getPayloadBytes() {
    T sampleMessage = payload.get();
    try {
      byte[] encodedValue = this.encoderDecoder.encode(sampleMessage);
      return compressor.compress(encodedValue);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  /**
   * Retrieves a payload object from the given compressed byte array.
   *
   * <p>This method first decompresses the byte array and then decodes it back into an object of
   * type {@code T}.
   *
   * @param compressedValue The byte array containing the compressed payload data.
   * @return The decoded payload object of type {@code T}.
   * @throws RuntimeException If an IOException occurs during decompression or decoding.
   */
  public T getPayloadObject(byte[] compressedValue) {
    try {
      byte[] deCompressedValue = compressor.deCompress(compressedValue);
      return this.encoderDecoder.decode(deCompressedValue, this.payloadClass);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }
}
