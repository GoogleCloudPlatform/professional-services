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
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.FieldList;
import com.google.cloud.pso.util.BQDatasetSchemas;
import com.google.cloud.pso.util.Constants;
import com.google.common.annotations.VisibleForTesting;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

/**
 * The {@link JsonEventMatcher} builds the connection to BigQuery schema as well as validating
 * incoming JSON file with the schema in BigQuery.
 */
public class JsonEventMatcher extends DoFn<KV<String, String>, KV<String, String>> {
  private static BQDatasetSchemas testBqDatasetSchema;

  private BQDatasetSchemas bqDatasetSchema;
  private String datasetName;

  public JsonEventMatcher(String datasetName) {
    this.datasetName = datasetName;
  }

  @Setup
  public void setup() {
    BQDatasetSchemas.setDataset(datasetName);
    bqDatasetSchema = BQDatasetSchemas.getInstance();
  }

  @ProcessElement
  public void processElement(ProcessContext context) {
    JsonFactory factory = new JsonFactory();
    ObjectMapper mapper = new ObjectMapper(factory);
    KV<String, String> element = context.element();
    try {
      JsonNode rootNode = mapper.readTree(element.getValue());
      KV<String, String> returnValue = KV.of(element.getKey(), rootNode.toString());

      JsonNode jsonResultMatchNode =
          buildMatchedJsonNodeFromTableSchema(element.getKey(), rootNode);

      // Obtain the good schema and output it to the ProcessContext
      returnValue = KV.of(element.getKey(), jsonResultMatchNode.toString());
      context.output(returnValue);
      // Unknown Schema detected
      if (!rootNode.equals(jsonResultMatchNode)) {
        KV<String, String> invalidSchemaReturnValue = KV.of(element.getKey(), rootNode.toString());
        context.output(Constants.UNMATCH_SCHEMA_TAG, invalidSchemaReturnValue);
      }

    } catch (JsonProcessingException e) {
      // TODO: Should Throw or give alert to user
      e.printStackTrace();
    }
  }

  /**
   * Build JSON Node where it will match with the existing schema. It will remove all unexpected
   * element from the json that doesn't match with the schema. For any missing element it create an
   * equivalent element and set it as "null", in case of an extra field that doesn't match the
   * schema the field will be remove.
   *
   * @param eventname: the table name which correspond to the actual eventname
   * @param node: JSON node representation of the actual event data was send
   * @return new JsonNode which correspond that mimic the existing schema structure in BQ
   */
  public JsonNode buildMatchedJsonNodeFromTableSchema(String eventName, JsonNode originalNode) {
    ObjectNode curNode =
        matchAndBuildObjectNode(
            new ObjectMapper().createObjectNode(),
            originalNode,
            testBqDatasetSchema == null
                ? bqDatasetSchema.getFieldList(eventName)
                : testBqDatasetSchema.getFieldList(eventName));

    return curNode;
  }

  private ObjectNode matchAndBuildObjectNode(
      ObjectNode node, JsonNode actualNode, FieldList fieldList) {
    for (Field f : fieldList) {
      if (actualNode.get(f.getName()) == null) {
        node.set(f.getName(), null);
        continue;
      }

      if (!f.getType().name().equalsIgnoreCase("RECORD")) {
        node.set(f.getName(), actualNode.get(f.getName()));
      } else {
        ObjectNode recur =
            matchAndBuildObjectNode(
                new ObjectMapper().createObjectNode(),
                actualNode.get(f.getName()),
                f.getSubFields());
        node.set(f.getName(), recur);
      }
    }
    return node;
  }

  // Requires for unit testing
  @VisibleForTesting
  public JsonEventMatcher withTestServices(BQDatasetSchemas testBqDatasetSchema) {
    JsonEventMatcher.testBqDatasetSchema = testBqDatasetSchema;
    return this;
  }
}
