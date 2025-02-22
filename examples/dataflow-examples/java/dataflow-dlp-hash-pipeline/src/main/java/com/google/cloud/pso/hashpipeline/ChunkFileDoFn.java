/*
 * Copyright (C) 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.hashpipeline;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.ReadableByteChannel;
import org.apache.beam.sdk.io.FileIO;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.DoFn.ProcessContext;
import org.apache.beam.sdk.transforms.DoFn.ProcessElement;
import org.apache.beam.sdk.values.KV;

public class ChunkFileDoFn extends DoFn<FileIO.ReadableFile, KV<String, String>> {
  private static final int DEFAULT_BUFFER_SIZE = 10000;
  private static final String SSN_CHARS = "0123456789-";
  private int bufferSize = DEFAULT_BUFFER_SIZE;

  @ProcessElement
  public void processElement(ProcessContext c) throws IOException {
    FileIO.ReadableFile file = c.element();
    String filename = file.getMetadata().resourceId().toString();

    ByteBuffer buff = ByteBuffer.allocate(this.bufferSize);
    ReadableByteChannel channel = file.open();
    while (channel.read(buff) > 0) {
      buff.flip();
      StringBuilder sb = new StringBuilder();
      while (buff.hasRemaining()) {
        char ch = (char) buff.get();
        sb.append(ch);
      }
      String text = sb.toString();
      buff.clear();
      // If the buffer happens to end on a character that might
      // be an SSN, we don't want to split the SSN. Rather we'll
      // iterate backward until we find the last character that
      // definitely won't be in an SSN, truncate the output, and
      // then put the rest back on the buffer for the next iteration.
      if (!isValidIndex(text.length() - 1, text)) {
        int last = lastValidIndex(text);
        for (int i = last; i < text.length(); i++) {
          buff.putChar(text.charAt(i));
        }
        text = text.substring(0, last);
      }

      c.output(KV.of(filename, text));
    }
    channel.close();
  }

  private Boolean isValidIndex(int idx, String str) {
    // Valid index if idx is not included in the potential SSN_CHARS
    return SSN_CHARS.indexOf(str.charAt(idx)) == -1;
  }

  private int lastValidIndex(String str) {
    int lastIdx = str.length() - 1;
    while (--lastIdx > 0) {
      if (isValidIndex(lastIdx, str)) {
        return lastIdx;
      }
    }
    return 0;
  }

  // Allow overriding the buffer size for tests.
  public ChunkFileDoFn withBufferSize(int size) {
    this.bufferSize = size;
    return this;
  }
}
