/**
  * Copyright 2019 Google LLC
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  * https://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */

package com.google.cloud.pso.kafka2avro

import com.google.cloud.pso.kafka2avro.config.Kafka2AvroConfig
import com.google.cloud.pso.kafka2avro.demo.MyDemoType
import com.google.cloud.pso.kafka2avro.utils.Kafka2AvroUtils
import com.spotify.scio.{ContextAndArgs, ScioContext}
import com.spotify.scio.coders.Coder
import com.spotify.scio.values.SCollection
import org.apache.beam.sdk.io.kafka.KafkaIO
import org.apache.beam.sdk.transforms.PTransform
import org.apache.beam.sdk.values.{PCollection, PDone}
import org.apache.kafka.common.serialization.StringSerializer
import org.slf4j.{Logger, LoggerFactory}

/** Pipeline to showcase how to write objects to Kafka,
  *
  * You can use this Dataflow pipeline to populate Kafka with some objects and
  * test the Kafka2Avro pipeline.
  */
object Object2Kafka {

  /** T is the type that will be serialized and written to Kafka.
    *
    * Here we only show 1 type, and we use our MyDemotype case class to
    * showcase how to encode the object into a base64 string.
    */
  type T = MyDemoType

  private val Logger: Logger = LoggerFactory.getLogger(this.getClass)

  /** The main function of this application.
    *
    * @param cmdLineArgs Array of command line arguments
    */
  def main(cmdLineArgs: Array[String]): Unit = {
    val pipelineFunc: Kafka2AvroConfig => Unit =
      runPipeline(cmdLineArgs, _)

    Kafka2AvroUtils.parseConfigAndRunPipeline(pipelineFunc, Logger)
  }

  /** Run the pipeline with the provided config options.
    *
    * @param cmdLineArgs Array of command line arguments passed to the pipeline
    * @param config An object with all the configuration parameters for the pipeline.
    */
  def runPipeline(cmdLineArgs: Array[String], config: Kafka2AvroConfig):Unit = {
    implicit val (sc: ScioContext, _) = ContextAndArgs(cmdLineArgs)

    // Use Kryo for serialization
    implicit def coderKafkaRecord: Coder[T] = Coder.kryo[T]

    // ETL process
    Logger.info(s"Running Extract phase: generating ${config.numDemoObjects} demo objects")
    val extracted   = extract(config)

    Logger.info("Running Transform phase: serializing the objects into base64 encoded strings")
    val transformed = transform(extracted)

    Logger.info("Running Load phase: writing the strings to Kafka")
    val _           = load(transformed, config)

    Logger.info("All done. Give me an E, give me a T, give me an L!")

    sc.run
  }

  /** Generate a SCollection of objects **/
  def extract(config: Kafka2AvroConfig)(implicit sc: ScioContext): SCollection[T] = {
    // Just create a collection with N copies of the demo objects
    val n: Int = config.numDemoObjects
    val objects: List[T] = createDemoObjects(n)
    sc.parallelize(objects).withName(s"Generate $n demo objects")
  }

  /** Transform the objects into base64 encoded strings **/
  def transform(c: SCollection[T]): SCollection[String] =
    c
      .map(Kafka2AvroUtils.object2String)
      .withName("Serialize objects")

  /** Write the strings to Kafka **/
  def load(c: SCollection[String], config: Kafka2AvroConfig): Unit = {
    val w: PTransform[PCollection[String], PDone] = KafkaIO.write[Void,String]
      .withBootstrapServers(config.broker)
      .withTopic(config.kafkaTopic)
      .withValueSerializer(classOf[StringSerializer])
      .values

    c.saveAsCustomOutput("Write objects to Kafka", w)
  }

  /** Create a list of demo objects.
    *
    * These objects will be serialized as base64 encoded strings, and then
    * written to Kafka.
    *
    * @param n The number of objects to generate.
    * @return A list of n objects for demo purposes.
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
