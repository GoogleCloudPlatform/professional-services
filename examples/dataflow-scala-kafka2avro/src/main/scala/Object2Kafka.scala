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


import com.google.cloud.pso.kafka2avro.config.Kafka2AvroConfig
import com.google.cloud.pso.kafka2avro.demo.MyDemoType
import com.google.cloud.pso.kafka2avro.utils.Kafka2AvroUtils
import com.spotify.scio.coders.Coder
import com.spotify.scio.values.SCollection
import com.spotify.scio.{ ContextAndArgs, ScioContext }
import org.apache.beam.sdk.io.TFRecordIO.Write
import org.apache.beam.sdk.io.TextIO.Write
import org.apache.beam.sdk.io.kafka.KafkaIO
import org.apache.beam.sdk.transforms.PTransform
import org.apache.beam.sdk.values.{ PCollection, PDone }
import org.apache.kafka.common.serialization.StringSerializer
import org.slf4j.{ Logger, LoggerFactory }
import pureconfig.error.ConfigReaderFailures
import pureconfig.generic.auto._

/**
  * This is just to showcase how to write objects to Kafka. You can use this
  * Dataflow pipeline to populate Kafka with some objects and test the
  * Kafka2Avro pipeline
  */
object Object2Kafka {

  // T is the type that will be serialized and written to Kafka
  // Here we only show 1 type, and we use our MyDemotype case class to showcase
  // how to encode the object into a base64 string
  type T = MyDemoType

  private val logger: Logger = LoggerFactory.getLogger(this.getClass)

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
        val extracted   = extract
        val transformed = transform(extracted)
        val _           = load(transformed)

        sc.close
    }
  }

  /** Generate a SCollection of objects **/
  def extract(implicit config: Kafka2AvroConfig, sc: ScioContext): SCollection[T] = {
    // Just create a collection with N copies of the demo objects
    val n: Int = config.numDemoObjects
    val objects: List[T] = createDemoObjects(n)
    sc.parallelize(objects)
  }

  /** Transform the objects into base64 encoded strings **/
  def transform(c: SCollection[T]): SCollection[String] =
    c.map(Kafka2AvroUtils.object2String)

  /** Write the strings to Kafka **/
  def load(c: SCollection[String])(implicit config: Kafka2AvroConfig): Unit = {
    val w: PTransform[PCollection[String], PDone] = KafkaIO.write[Void,String]
      .withBootstrapServers(config.broker)
      .withTopic(config.kafkaTopic)
      .withValueSerializer(classOf[StringSerializer])
      .values

    c.saveAsCustomOutput("WriteToKafka", w)
  }

  /** Create a list of demo objects.
    *
    * These objects will be serialized as base64 encoded strings, and then
    * written to Kafka.
    *
    * @param n the number of objects to generate
    */
  def createDemoObjects(n: Int): List[T] = {
    (1 to n).map { i =>
      MyDemoType(
        "This is a test name",
        "This is a test version",
        i)
    }.toList
  }
}
