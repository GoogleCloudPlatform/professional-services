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
import com.google.cloud.pso.util.BQDatasetSchemas;
import com.google.cloud.pso.util.Constants;
import com.google.common.annotations.VisibleForTesting;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;

/**
 * The {@code JsonSchemaExist} check whether the incoming the event schema is a known schema. In the
 * case of unknown schema, the result will be outputted in {@code UNKNOWN_SCHEMA_TAG}.
 */
public class JsonSchemaExist extends DoFn<KV<String, String>, KV<String, String>> {
  // Requires 2 BQDataSetSchemas for testing purposes
  private BQDatasetSchemas bqDatasetSchema;
  private static BQDatasetSchemas testBqDatasetSchema;
  private String datasetName;

  public JsonSchemaExist(String datasetName) {
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
      BQDatasetSchemas actualBqDatasetSchema =
          testBqDatasetSchema == null ? bqDatasetSchema : testBqDatasetSchema;
      if (!actualBqDatasetSchema.isTableSchemaExist(element.getKey())) {
        context.output(Constants.UNKNOWN_SCHEMA_TAG, returnValue);
        return;
      }

      context.output(returnValue);

    } catch (JsonProcessingException e) {
      // TODO: Should Throw or give alert to user
      e.printStackTrace();
    }
  }

  // Requires for unit testing
  @VisibleForTesting
  public JsonSchemaExist withTestServices(BQDatasetSchemas testBqDatasetSchema) {
    JsonSchemaExist.testBqDatasetSchema = testBqDatasetSchema;
    return this;
  }
}
