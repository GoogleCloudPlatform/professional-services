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
