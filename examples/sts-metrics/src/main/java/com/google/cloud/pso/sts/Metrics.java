/*
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.sts;

import static io.opencensus.stats.Stats.getViewManager;

import io.opencensus.common.Scope;
import io.opencensus.exporter.stats.prometheus.PrometheusStatsCollector;
import io.opencensus.stats.Aggregation;
import io.opencensus.stats.Aggregation.Distribution;
import io.opencensus.stats.BucketBoundaries;
import io.opencensus.stats.Measure.MeasureDouble;
import io.opencensus.stats.Measure.MeasureLong;
import io.opencensus.stats.Stats;
import io.opencensus.stats.StatsRecorder;
import io.opencensus.stats.View;
import io.opencensus.stats.View.Name;
import io.opencensus.stats.ViewManager;
import io.opencensus.tags.TagContext;
import io.opencensus.tags.TagContextBuilder;
import io.opencensus.tags.TagKey;
import io.opencensus.tags.TagValue;
import io.opencensus.tags.Tagger;
import io.opencensus.tags.Tags;
import io.prometheus.client.Collector.MetricFamilySamples;
import io.prometheus.client.CollectorRegistry;
import io.prometheus.client.exporter.HTTPServer;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The class provides functionality to instrument application and JVM metrics and expose them
 * through /metrics endpoint in Prometheus format. The implementation is based on OpenCensus. In
 * OpenCensus, a metric is defined by the following components 1) Measure -- Defines what is
 * measured, value(long/double) and unit(i.e. byte, count) 2) View -- Associates a measure with
 * aggregate functions and tags, and defines a metric Metrics data are recorded using StatsRecorder.
 * PrometheusStatsCollector and JmxCollector are used to collect metrics data recorded so far, apply
 * aggregate functions, and return the metrics in Prometheus format when /metrics is called.
 */
public class Metrics {

  public static final String PROMETHEUS_HOST = "localhost";
  public static final int PROMETHEUS_PORT = 8888;
  public static final double MIN_IN_MS = 60 * 1000;

  // Metric names
  public static final String METRIC_NAME_OBJECT_DELETED_NUM = "object_deleted_num";
  public static final String METRIC_NAME_OBJECT_DELETED_BYTES = "object_deleted_bytes";
  public static final String METRIC_NAME_STS_OPERATION_NUM = "sts_operation_num";
  public static final String METRIC_NAME_STS_OPERATION_LATENCY = "sts_operation_latency";

  // Measures
  public static final MeasureLong M_STS_OPERATION_NUM =
      MeasureLong.create(METRIC_NAME_STS_OPERATION_NUM, "The number of STS operations", "1");
  public static final MeasureLong M_OBJECT_DELETED_NUM =
      MeasureLong.create(METRIC_NAME_OBJECT_DELETED_NUM, "The number of object deleted", "1");
  public static final MeasureLong M_OBJECT_DELETED_BYTES =
      MeasureLong.create(METRIC_NAME_OBJECT_DELETED_BYTES, "The bytes of objected deleted", "By");
  public static final MeasureDouble M_STS_OPERATION_LATENCY_MS =
      MeasureDouble.create(
          METRIC_NAME_STS_OPERATION_LATENCY, "The latency of STS operations", "ms");

  // Tagkey and tag definition
  public static final TagKey TAG_KEY_PROJECT_ID = TagKey.create("projectId");
  public static final TagKey TAG_KEY_STATUS = TagKey.create("status");
  public static final TagKey TAG_KEY_SRC_BUCKET_ID = TagKey.create("srcBucketId");
  public static final TagKey TAG_KEY_DEST_BUCKET_ID = TagKey.create("destBucketId");
  public static final List<TagKey> STS_OPS_TAGS =
      Collections.unmodifiableList(
          Arrays.asList(
              TAG_KEY_STATUS, TAG_KEY_SRC_BUCKET_ID, TAG_KEY_DEST_BUCKET_ID, TAG_KEY_PROJECT_ID));

  public static final List<Double> STS_OPS_DISTRIBUTION_BUCKETS =
      Arrays.asList(
          // [>=0m, >=1m, >=5m, >=10m, >=30m, >=60m, >=120m, >=180m, >=240m,
          // >=300m, >=360m, >=420m, >=480m]
          0.0,
          1.0 * MIN_IN_MS,
          5.0 * MIN_IN_MS,
          10.0 * MIN_IN_MS,
          30.0 * MIN_IN_MS,
          60.0 * MIN_IN_MS,
          120.0 * MIN_IN_MS,
          180.0 * MIN_IN_MS,
          240.0 * MIN_IN_MS,
          300.0 * MIN_IN_MS,
          360.0 * MIN_IN_MS,
          420.0 * MIN_IN_MS,
          480.0 * MIN_IN_MS);

  private static final Logger logger = LoggerFactory.getLogger(Metrics.class);
  private static final Tagger tagger = Tags.getTagger();
  private static final StatsRecorder statsRecorder = Stats.getStatsRecorder();

  public static void init() throws IOException {
    registerAllViews();
    registerCollectors();
  }

  /**
   * Record metrics data with long value
   *
   * @param ml A measure with long value
   * @param n The recorded long value
   */
  public static void recordStat(MeasureLong ml, Long n) {
    TagContext tctx = tagger.emptyBuilder().build();
    try (Scope ss = tagger.withTagContext(tctx)) {
      statsRecorder.newMeasureMap().put(ml, n).record();
    }
  }

  /**
   * Record long value metrics data with tags
   *
   * @param tagMap A tag map with tag key and value paris
   * @param ml A measure with long value
   * @param n The recorded long value
   */
  public static void recordTaggedStat(Map<TagKey, String> tagMap, MeasureLong ml, Long n) {
    TagContextBuilder builder = tagger.emptyBuilder();
    for (TagKey key : tagMap.keySet()) {
      builder.putPropagating(key, TagValue.create(tagMap.get(key)));
    }
    TagContext tctx = builder.build();
    try (Scope ss = tagger.withTagContext(tctx)) {
      statsRecorder.newMeasureMap().put(ml, n).record();
    }
  }

  /**
   * Record double value metrics data with tags
   *
   * @param tagMap A tag map with tag key and value paris
   * @param md A measure with double value
   * @param d The recorded double value
   */
  public static void recordTaggedStat(Map<TagKey, String> tagMap, MeasureDouble md, Double d) {
    TagContextBuilder builder = tagger.emptyBuilder();
    for (TagKey key : tagMap.keySet()) {
      builder.putPropagating(key, TagValue.create(tagMap.get(key)));
    }
    TagContext tctx = builder.build();
    try (Scope ss = tagger.withTagContext(tctx)) {
      statsRecorder.newMeasureMap().put(md, d).record();
    }
  }

  /**
   * Get the stats recorder
   *
   * @return
   */
  public static StatsRecorder getStatsRecorder() {
    return statsRecorder;
  }

  private static void registerAllViews() {
    Aggregation stsOpsLatencyDistribution =
        Distribution.create(BucketBoundaries.create(STS_OPS_DISTRIBUTION_BUCKETS));

    ViewManager viewManager = getViewManager();

    View[] views =
        new View[] {
          View.create(
              Name.create(METRIC_NAME_OBJECT_DELETED_NUM),
              "The number of deleted objects",
              M_OBJECT_DELETED_NUM,
              Aggregation.Sum.create(),
              STS_OPS_TAGS),
          View.create(
              Name.create(METRIC_NAME_OBJECT_DELETED_BYTES),
              "The number of bytes deleted",
              M_OBJECT_DELETED_BYTES,
              Aggregation.Sum.create(),
              STS_OPS_TAGS),
          View.create(
              Name.create(METRIC_NAME_STS_OPERATION_NUM),
              "The number of STS operations",
              M_STS_OPERATION_NUM,
              Aggregation.Count.create(),
              STS_OPS_TAGS),
          View.create(
              Name.create(METRIC_NAME_STS_OPERATION_LATENCY),
              "The latency of STS operations",
              M_STS_OPERATION_LATENCY_MS,
              stsOpsLatencyDistribution,
              STS_OPS_TAGS)
        };

    for (View view : views) {
      viewManager.registerView(view);
    }
  }

  private static void registerCollectors() throws IOException {
    PrometheusStatsCollector.createAndRegister();
    HTTPServer server = new HTTPServer(PROMETHEUS_HOST, PROMETHEUS_PORT, true);
    printCollectors();
  }

  private static void printCollectors() {
    Enumeration<MetricFamilySamples> mfs = CollectorRegistry.defaultRegistry.metricFamilySamples();
    logger.info("*** MetricFamily Dump Begin ***");
    int i = 0;
    while (mfs.hasMoreElements()) {
      MetricFamilySamples samples = mfs.nextElement();
      logger.info(samples.toString());
      i++;
    }
    logger.info(String.format("*** %d MetricFamily End ***", i));
  }

  public static void generateStsMetrics(
      String sourceBucket,
      String destBucket,
      String projectId,
      String status,
      double latency,
      long objectsCopied,
      long bytesCopied) {
    Map<TagKey, String> tagMap = new HashMap<>();
    tagMap.put(TAG_KEY_SRC_BUCKET_ID, sourceBucket);
    tagMap.put(TAG_KEY_DEST_BUCKET_ID, destBucket);
    tagMap.put(TAG_KEY_PROJECT_ID, projectId);
    tagMap.put(TAG_KEY_STATUS, status);

    recordTaggedStat(tagMap, M_STS_OPERATION_NUM, 1L);
    recordTaggedStat(tagMap, M_STS_OPERATION_LATENCY_MS, latency);
    recordTaggedStat(tagMap, M_OBJECT_DELETED_NUM, objectsCopied);
    recordTaggedStat(tagMap, M_OBJECT_DELETED_BYTES, bytesCopied);
  }
}
