/*
 * Copyright 2019 Google LLC All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.example

import java.nio.charset.StandardCharsets
import java.util.Collections

import com.google.bigtable.v2.Mutation
import com.google.cloud.bigtable.config.{BigtableOptions, BulkOptions}
import com.google.cloud.example.protobuf.Metrics
import com.google.protobuf.ByteString
import org.apache.beam.sdk.Pipeline
import org.apache.beam.sdk.io.gcp.bigtable.BigtableIO
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO
import org.apache.beam.sdk.options.PipelineOptionsFactory
import org.apache.beam.sdk.transforms.DoFn.ProcessElement
import org.apache.beam.sdk.transforms.{DoFn, ParDo, SerializableFunction}
import org.apache.beam.sdk.values.KV
import org.joda.time.Duration

object CloudPipeline extends Logging {
  def main(args: Array[String]): Unit = {
    val options = PipelineOptionsFactory.fromArgs(args: _*).withValidation().as(classOf[CloudPipelineOptions])
    run(options)
  }

  private val BigtableConfigurator = new SerializableFunction[BigtableOptions.Builder, BigtableOptions.Builder] {
    override def apply(options: BigtableOptions.Builder): BigtableOptions.Builder = {
      options
        .setUserAgent("CloudPipeline")
        .setBulkOptions(BulkOptions.builder()
          .enableBulkMutationThrottling().build())
    }
  }

  def run(options: CloudPipelineOptions): Unit = {
    val cq = ByteString.copyFrom(options.getColumn, StandardCharsets.UTF_8)
    val cf = options.getColumnFamily
    val project = options.getProject
    val instanceId = options.getInstanceId
    val tableId = options.getTableId

    logger.info("Creating pipeline")
    val p = Pipeline.create(options)

    val subscription = s"projects/${options.getProject}/subscriptions/${options.getSubscription}"

    p.begin()
      .apply("Read Metrics", PubsubIO.readProtos(classOf[Metrics])
        .fromSubscription(subscription))
      .apply("Create Row Keys", ParDo.of(new DoFn[Metrics,KV[ByteString,java.lang.Iterable[Mutation]]] {
        @ProcessElement
        private[example] def process(c: ProcessContext): Unit = {
          val metrics: Metrics = c.element()
          val rowKey = RowKeys.byHostInfo(metrics.getHostInfo, metrics.getTimestamp/1000L)
          val m = Mutation.newBuilder().setSetCell(
            Mutation.SetCell.newBuilder()
              .setValue(metrics.toByteString)
              .setFamilyName(cf)
              .setColumnQualifier(cq)
              .setTimestampMicros(-1))
          c.output(KV.of(rowKey, Collections.singleton(m.build())))
        }
      }))
      .apply("Write to Bigtable", BigtableIO.write()
        .withProjectId(project)
        .withInstanceId(instanceId)
        .withBigtableOptionsConfigurator(BigtableConfigurator)
        .withTableId(tableId))

    logger.info("Running pipeline")
    val results = p.run()
    results.waitUntilFinish(Duration.standardSeconds(120))
    logger.info("Pipeline finished")
  }
}
