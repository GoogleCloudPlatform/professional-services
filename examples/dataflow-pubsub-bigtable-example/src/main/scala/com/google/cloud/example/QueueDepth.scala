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

import com.google.cloud.monitoring.v3.{MetricServiceClient, MetricServiceSettings}
import com.google.monitoring.v3.{ListTimeSeriesRequest, TimeInterval}
import com.google.protobuf.Timestamp

import scala.collection.JavaConverters.iterableAsScalaIterableConverter

object QueueDepth extends Logging {
  case class Config(project: String = "myproject",
                    subscription: String = "mysubscription",
                    window: Long = 300)

  private val Parser: scopt.OptionParser[Config] =
    new scopt.OptionParser[Config]("QueueDepth") {
      head("QueueDepth", "3.x")

      opt[String]('p', "project")
        .required()
        .action{(x, c) => c.copy(project = x)}
        .text("projectId is a string property")

      opt[String]('s', "subscription")
        .required()
        .action{(x, c) => c.copy(subscription = x)}
        .text("subscription is a string property")

      opt[Long]('w', "window")
        .action{(x, c) => c.copy(window = x)}
        .text("window is a Long property")

      note("Queries Pubsub subscription queue depth from StackDriver Monitoring")

      help("help")
        .text("prints this usage text")
    }

  def main(args: Array[String]): Unit = {
    Parser.parse(args, Config()) match {
      case Some(config) =>
        val metrics = MetricServiceClient.create(MetricServiceSettings.newBuilder().build())
        val t1 = System.currentTimeMillis() / 1000L
        val t0 = t1 - config.window

        val subscription = config.subscription
        val filter = s"""metric.type = "pubsub.googleapis.com/subscription/num_undelivered_messages" AND resource.label.subscription_id = "$subscription""""

        logger.info(s"Querying $subscription")
        val request = ListTimeSeriesRequest
          .newBuilder()
          .setName(s"projects/${config.project}")
          .setFilter(filter)
          .setInterval(TimeInterval.newBuilder()
            .setStartTime(Timestamp.newBuilder().setSeconds(t0))
            .setEndTime(Timestamp.newBuilder().setSeconds(t1)))
          .setView(ListTimeSeriesRequest.TimeSeriesView.FULL)

        val response = metrics.listTimeSeries(request.build)
        for {
          series <- response.iterateAll.asScala.headOption
          point <- series.getPointsList.asScala.headOption
        } yield {
          val count = point.getValue.getInt64Value
          val t = point.getInterval.getEndTime.getSeconds
          System.out.println(s"$subscription has $count undelivered messages at t = $t")
        }
        logger.info(s"Finished querying")
      case _ =>
        System.err.println(s"Unable to parse args '${args.mkString(" ")}'")
    }
  }
}
