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

package com.google.cloud.pso.options;

import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.Validation;

/**
 * Options interface for specifying the inputs to the {@link com.google.cloud.pso.IndexerMain}
 * pipeline.
 */
public interface IndexerOptions extends DataflowPipelineOptions, BigtableOptions {

  @Description(
      "The Cloud Pub/Sub subscription to consume from. "
          + "The name should be in the format of "
          + "projects/<project-id>/subscriptions/<subscription-name>.")
  @Validation.Required
  String getInputSubscription();

  void setInputSubscription(String inputSubscription);

  @Description(
      "The Cloud Pub/Sub topic to publish rejected messages to. "
          + "The name should be in the format of "
          + "projects/<project-id>/topics/<topic-name>.")
  @Validation.Required
  String getRejectionTopic();

  void setRejectionTopic(String rejectionTopic);

  @Description(
      "The ID field that needs to be extracted from the json message."
          + " This ID field will be used as the document id "
          + "for the index.")
  @Validation.Required
  String getIdField();

  void setIdField(String idField);

  @Description("Elasticsearch cluster address(es).")
  @Validation.Required
  String getAddresses();

  void setAddresses(String addresses);

  @Description("Name of the Elasticsearch index.")
  @Validation.Required
  String getIndex();

  void setIndex(String index);

  @Description("Name of the Elasticsearch type.")
  @Validation.Required
  String getType();

  void setType(String type);
}
