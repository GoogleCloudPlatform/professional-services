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

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import org.apache.commons.compress.compressors.lz4.BlockLZ4CompressorInputStream;
import org.apache.commons.compress.compressors.lz4.BlockLZ4CompressorOutputStream;

/**
 * This class implements the {@link Compression} interface and provides methods for compressing and
 * decompressing data using the LZ4 compression algorithm.
 */
public class LZ4Compression implements Compression {

  /**
   * Compresses the given byte array using the LZ4 algorithm.
   *
   * @param data The data to be compressed.
   * @return The compressed data as a byte array.
   * @throws IOException If an I/O error occurs during compression.
   */
  @Override
  public byte[] compress(byte[] data) throws IOException {
    byte[] compressedBytes = null;
    // Create a byte array output stream to hold the compressed data
    try (ByteArrayOutputStream compressedBytesStream = new ByteArrayOutputStream()) {
      // Create a BlockLZ4 compression stream for writing
      try (BlockLZ4CompressorOutputStream compressorOutputStream =
          new BlockLZ4CompressorOutputStream(compressedBytesStream)) {
        // Write the data to be compressed to the stream
        compressorOutputStream.write(data);
        // Finalize the compression (write any remaining data)
        compressorOutputStream.finish();
      }
      compressedBytes = compressedBytesStream.toByteArray();
    }
    return compressedBytes;
  }

  /**
   * Decompresses the given compressed data using the LZ4 algorithm.
   *
   * @param compressedData The compressed data as a byte array.
   * @return The decompressed data as a byte array.
   * @throws IOException If an I/O error occurs during decompression.
   */
  @Override
  public byte[] deCompress(byte[] compressedData) throws IOException {
    // Wrap the compressed data in an InputStream
    try (InputStream inputStream = new ByteArrayInputStream(compressedData)) {

      // Create a BlockLZ4 decompression stream
      try (BlockLZ4CompressorInputStream decompressStream =
          new BlockLZ4CompressorInputStream(inputStream)) {

        // Allocate a buffer to hold the decompressed data (choose an appropriate size based on your
        // data)
        byte[] decompressedBytes = new byte[compressedData.length * 2]; // Might need adjustment

        // Read decompressed data into the buffer
        int bytesRead = 0;
        int totalRead = 0;
        while ((bytesRead =
                decompressStream.read(
                    decompressedBytes, totalRead, decompressedBytes.length - totalRead))
            != -1) {
          totalRead += bytesRead;
          // If buffer is full, reallocate a bigger one (optional)
          if (totalRead == decompressedBytes.length) {
            decompressedBytes = Arrays.copyOf(decompressedBytes, decompressedBytes.length * 2);
          }
        }

        // Resize the decompressed data to the actual size read
        decompressedBytes = Arrays.copyOf(decompressedBytes, totalRead);
        return decompressedBytes;
      }
    }
  }
}
