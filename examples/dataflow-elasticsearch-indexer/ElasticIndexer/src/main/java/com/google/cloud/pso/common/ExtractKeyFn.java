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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.beam.sdk.io.elasticsearch.ElasticsearchIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Implementation of {@link ElasticsearchIO.Write.FieldValueExtractFn} to extract Elasticsearch ID
 * field from JSON message.
 */
public class ExtractKeyFn implements ElasticsearchIO.Write.FieldValueExtractFn {

  private String jsonKeyPath;
  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final Logger LOG = LoggerFactory.getLogger(ExtractKeyFn.class);

  public ExtractKeyFn(String jsonKeyPath) {
    this.jsonKeyPath = jsonKeyPath;
  }

  @Override
  public String apply(JsonNode input) {
    String fieldValue;
    try {
      JsonNode valueAtPath = input.at(jsonKeyPath);
      if (valueAtPath.isMissingNode()) {
        throw new RuntimeException("Unable to extract id field: " + jsonKeyPath);
      }
      fieldValue = MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(valueAtPath);
    } catch (JsonProcessingException e) {
      LOG.error("Unable to parse json input: " + input.asText());
      throw new RuntimeException(e);
    }
    return fieldValue;
  }
}
