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

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

public class LZ4CompressionTest {

  @Test
  void testDeCompression_returns_OriginalValue() throws IOException {
    String someText =
        "Sample random text used for evaluating LZ4Compression efficiency compared to original bytes";
    LZ4Compression lz4CompressDecompress = new LZ4Compression();
    byte[] utf8Bytes = someText.getBytes(StandardCharsets.UTF_8);
    byte[] compressedBytes = lz4CompressDecompress.compress(utf8Bytes);
    byte[] deCompressedBytes = lz4CompressDecompress.deCompress(compressedBytes);
    assertEquals(utf8Bytes.length, deCompressedBytes.length);
  }
}
