/**
  Copyright 2019 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */


package com.google.cloud.pso.kafka2avro

import com.google.cloud.pso.kafka2avro.utils.Kafka2AvroUtils
import com.sksamuel.avro4s.{ AvroOutputStream, AvroSchema }
import java.io.OutputStream
import java.nio.channels.Channels

import com.spotify.scio.{Args, ContextAndArgs, ScioContext}
import com.spotify.scio.coders.Coder
import com.spotify.scio.values.SCollection
import com.google.cloud.pso.kafka2avro.config.Kafka2AvroConfig
import com.google.cloud.pso.kafka2avro.demo.MyDemoType
import org.apache.avro.Schema
import org.apache.beam.sdk.io.FileSystems
import org.apache.beam.sdk.io.fs.ResourceId
import org.apache.beam.sdk.io.kafka.{KafkaIO, KafkaRecord}
import org.apache.beam.sdk.transforms.windowing.IntervalWindow
import org.apache.beam.sdk.util.MimeTypes
import org.apache.beam.sdk.values.KV
import org.apache.kafka.common.serialization.StringDeserializer
import org.joda.time.Duration
import org.joda.time.format.ISODateTimeFormat
import org.slf4j.{ Logger, LoggerFactory }
import pureconfig.error.ConfigReaderFailures

import pureconfig.generic.auto._

object Kafka2Avro {

  // T is the type that must be read from Kafka
  // Here we only show 1 type, and we use our MyDemoType case class to showcase
  // how to export to Avro from a base64 encoded string
  type T = MyDemoType

  // Format timestamp for filenames
  private val dateTimeFormatter = ISODateTimeFormat.dateHourMinuteSecond
  private val endTimeFormatter = ISODateTimeFormat.hourMinuteSecond

  private val logger: Logger = LoggerFactory.getLogger(this.getClass)

  /** Group messages in windows using Beam
    *
    * Returns a SCollection of tuples, with the window and an iterable over the messages
    *
    * @param ps collection of messages to be grouped in windows
    */
  def windowIn(ps: SCollection[T]): SCollection[(IntervalWindow, Iterable[T])] = {
    val windows: SCollection[(IntervalWindow, Iterable[T])] =
      ps
      // Here we just make fixed windows of 30 secs, as an example
      .withFixedWindows(Duration.standardSeconds(30))
      .withWindow[IntervalWindow]
      .swap
      .groupByKey

    windows
  }

  /** The main function of this application
    *
    * @param args array of command line arguments
    */
  def main(cmdLineArgs: Array[String]): Unit = {
    val myConfigEither: Either[ConfigReaderFailures, Kafka2AvroConfig] =
      pureconfig.loadConfig[Kafka2AvroConfig]

    myConfigEither match {
      case Left(configErrors: ConfigReaderFailures) =>
        Kafka2AvroUtils.failAndExitWithWrongConfig(configErrors, logger)
      case Right(configOk: Kafka2AvroConfig) =>
        implicit val config = configOk

        implicit val (sc: ScioContext, _) = ContextAndArgs(cmdLineArgs)

        // Use Kryo for serialization
        implicit def coderKafkaRecord: Coder[T] = Coder.kryo[T]

        // ETL process

        val outputLocation = "gs://%s/%s".format(
          config.destBucket,
          config.destPath)

        val extracted   = extract
        val transformed = transform(extracted)
        val _           = load(transformed, outputLocation)

        sc.close
    }
  }


  /** Read data from Kafka, and return the messages ignoring the keys */
  def extract(implicit config: Kafka2AvroConfig, sc: ScioContext): SCollection[String] = {
    val messages: SCollection[KV[String, String]] = sc.customInput("ReadFromKafka",
      KafkaIO.read[String, String]
        .withBootstrapServers(config.broker)
        .withTopic(config.kafkaTopic)
        .withKeyDeserializer(classOf[StringDeserializer])
        .withValueDeserializer(classOf[StringDeserializer])
        .withoutMetadata
    )

    // We will not use they key, so let's drop it to save some memory
    messages.map(_.getValue)
  }

  /** Transform the strings read from Kafka
    *
    * Here we try to decode the string into an object, and then group in a
    * window.
    */
  def transform(messages: SCollection[String]): SCollection[(IntervalWindow, Iterable[T])] = {
    val records: SCollection[T] = messages.map(Kafka2AvroUtils.string2object[T])

    // The windowIn function is assumed to be in scope.
    // It could also be passed as an argument to the transform step
    val groups: SCollection[(IntervalWindow, Iterable[T])] =
      records.transform("Windowing")(windowIn)

    groups
  }

  /** Load data into GCS
    *
    * After the transform step, we should now have a collection of objects,
    * grouped in windows. We will write each window in a separate file in GCS,
    * encoded as Avro.
    */
  def load(records: SCollection[(IntervalWindow, Iterable[T])], location: String)(implicit sc: ScioContext): Unit = {
    // Initialize `FileSystem` abstraction
    FileSystems.setDefaultPipelineOptions(sc.options)

    records
      .map { case (w: IntervalWindow, msgs: Iterable[T]) =>
        val outputShard: String =
          location + "/%s_%s.avro".format(
            dateTimeFormatter.print(w.start),
            endTimeFormatter.print(w.end)
          ).replace(":","").replace("-","")

        val resourceId: ResourceId = FileSystems.matchNewResource(outputShard, false)
        val out: OutputStream = Channels.newOutputStream(FileSystems.create(resourceId, MimeTypes.BINARY))

        val schema: Schema = AvroSchema[T]
        val outAvro: AvroOutputStream[T] = AvroOutputStream.data[T].to(out).build(schema)
        msgs.foreach { msg => outAvro.write(msg) }
        outAvro.close()
      }
  }
}
