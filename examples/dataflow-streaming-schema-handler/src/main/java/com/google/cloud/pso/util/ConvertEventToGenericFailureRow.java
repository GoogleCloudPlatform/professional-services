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

package com.google.cloud.pso.util;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.api.services.bigquery.model.TableRow;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;
import org.joda.time.Instant;

/**
 * The {@link JsonEventMatcher} builds the connection to BigQuery schema as well as validating
 * incoming JSON file with the schema in BigQuery.
 */
public class ConvertEventToGenericFailureRow extends DoFn<KV<String, String>, TableRow> {
  private String reason;
  private JsonFactory factory;
  private ObjectMapper mapper;

  public ConvertEventToGenericFailureRow(String reason) {
    this.reason = reason;
  }

  @Setup
  public void setup() {
    factory = new JsonFactory();
    mapper = new ObjectMapper(factory);
  }

  @ProcessElement
  public void processElement(ProcessContext context) {
    KV<String, String> element = context.element();
    TableRow row = new TableRow();
    try {
      JsonNode rootNode = mapper.readTree(element.getValue());
      row.put(Constants.EVENT_NAME, element.getKey());
      row.put(Constants.LAST_UPDATED_TIMESTAMP, new Instant().toString());
      row.put(Constants.REASON, reason);

      ((ObjectNode) rootNode).remove(Constants.LAST_UPDATED_TIMESTAMP);
      row.put(Constants.EVENT_BODY, rootNode.toString());
      context.output(row);
    } catch (JsonProcessingException e) {
      e.printStackTrace();
    }
  }
}
