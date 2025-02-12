/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.google.cloud.pso.common;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;
import java.io.IOException;
import java.util.Map;

/**
 * A {@link DoFn} that extracts a Boolean value associated with a json payload and adds a new field
 * to the json.
 */
public class InsertMetadataFn extends DoFn<KV<String, Boolean>, String> {

  private String columnQualifier;
  private ObjectMapper mapper;

  public InsertMetadataFn(String columnQualifier) {
    this.columnQualifier = columnQualifier;
    this.mapper = new ObjectMapper();
  }

  @ProcessElement
  public void processElement(ProcessContext context) throws IOException {
    KV<String, Boolean> kv = context.element();
    JsonNode payload = mapper.readTree(kv.getKey());
    Map<String, Object> elements = mapper.convertValue(payload, Map.class);
    elements.put(this.columnQualifier, kv.getValue());
    context.output(mapper.writeValueAsString(mapper.valueToTree(elements)));
  }
}
