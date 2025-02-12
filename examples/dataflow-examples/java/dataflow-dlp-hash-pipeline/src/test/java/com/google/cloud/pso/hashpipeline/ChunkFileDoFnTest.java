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

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;
import java.util.HashSet;
import java.util.Iterator;
import org.apache.beam.sdk.io.FileIO;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RunWith(JUnit4.class)
public class ChunkFileDoFnTest {
  private static final Logger log = LoggerFactory.getLogger(ChunkFileDoFnTest.class);
  @Rule public final transient TestPipeline pipeline = TestPipeline.create();

  @Test
  public void testChunkFileDoFnTest() throws IOException {
    ClassLoader classLoader = getClass().getClassLoader();
    File file = new File(classLoader.getResource("tiny.txt").getFile());
    String fn = file.getAbsolutePath();
    ReadableByteChannel chan = Channels.newChannel(new FileInputStream(fn));
    PCollection<KV<String, String>> results =
        pipeline
            .apply(FileIO.match().filepattern(fn))
            .apply(FileIO.readMatches())
            .apply(ParDo.of(new ChunkFileDoFn().withBufferSize(100)));

    // We want to make sure that all the potential socials are there
    // even after the file is chunked.
    HashSet<String> actual = new HashSet<String>();
    HashSet<String> expected = new HashSet<String>();
    expected.add("592113981");
    expected.add("413767393");
    expected.add("562236386");
    expected.add("236239556");
    expected.add("740344547");
    expected.add("997924697");
    expected.add("109394127");
    PAssert.that(results)
        .satisfies(
            input -> {
              Iterator<KV<String, String>> iter = input.iterator();
              while (iter.hasNext()) {
                KV<String, String> elem = iter.next();
                String text = elem.getValue();
                for (String ssn : expected) {
                  if (text.contains(ssn)) {
                    actual.add(ssn);
                  }
                }
              }
              assertThat(actual, is(expected));
              return null;
            });
    pipeline.run();
  }
}
