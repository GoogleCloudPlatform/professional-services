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
package com.google.cloud.pso.benchmarks.redis.compression;

import java.io.IOException;

/**
 * Defines methods for compressing and decompressing data. See {@link LZ4Compression} for
 * implementation of specific compression algorithms.
 */
public interface Compression {
  /**
   * Compresses the given byte array using a specific compression algorithm.
   *
   * @param data The data to be compressed.
   * @return The compressed data as a byte array.
   * @throws IOException If an I/O error occurs during compression.
   */
  byte[] compress(byte[] data) throws IOException;

  /**
   * Decompresses the given compressed data using the same compression algorithm used for
   * compression.
   *
   * @param compressedData The compressed data as a byte array.
   * @return The decompressed data as a byte array.
   * @throws IOException
   */
  byte[] deCompress(byte[] compressedData) throws IOException;
}
