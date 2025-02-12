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

import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.TupleTag;

public class Constants {

  // Constant for Json & Bigquery (BQ) fields
  public static final String EVENT_NAME = "event_name";
  public static final String EVENT_BODY = "event_body";
  public static final String LAST_UPDATED_TIMESTAMP = "last_updated_timestamp";
  public static final String REASON = "reason";

  // Constant for BQ dataset
  public static final String UNKNOWN_DATASET_SUFFIX = "_unknown_event";

  // Dataflow Output tag
  public static final TupleTag<KV<String, String>> MAIN_TAG = new TupleTag<KV<String, String>>() {};
  public static final TupleTag<KV<String, String>> MATCH_SCHEMA_TAG =
      new TupleTag<KV<String, String>>() {};
  public static final TupleTag<KV<String, String>> UNKNOWN_SCHEMA_TAG =
      new TupleTag<KV<String, String>>() {};
  public static final TupleTag<KV<String, String>> UNMATCH_SCHEMA_TAG =
      new TupleTag<KV<String, String>>() {};
}
