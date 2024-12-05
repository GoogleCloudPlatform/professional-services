/*
 * Copyright (C) 2022 Google LLC
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

package com.google.cloud.pso.transforms;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Iterator;
import java.util.Map.Entry;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReadPubSub extends DoFn<String, KV<String, String>> {
  private static final Logger LOG = LoggerFactory.getLogger(ReadPubSub.class);
  private JsonFactory factory;
  ObjectMapper mapper;

  @Setup
  public void setup() {
    factory = new JsonFactory();
    mapper = new ObjectMapper(factory);
  }

  @ProcessElement
  public void processElement(ProcessContext context) {
    String input = context.element();
    JsonNode rootNode;
    try {
      rootNode = mapper.readTree(input);
      Iterator<Entry<String, JsonNode>> fieldsIterator = rootNode.fields();
      Entry<String, JsonNode> field = fieldsIterator.next();

      context.output(KV.of(field.getKey(), field.getValue().toString()));
    } catch (JsonProcessingException e) {
      LOG.error("Unable to parse JSON Message, check the format of the JSON", e);
    }
  }
}
