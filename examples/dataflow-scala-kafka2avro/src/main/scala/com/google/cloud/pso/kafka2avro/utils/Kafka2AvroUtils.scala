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

package com.google.cloud.pso.kafka2avro.utils

import java.io.{ByteArrayInputStream, ObjectInputStream, ObjectOutputStream}
import java.util.Base64

import com.google.cloud.pso.kafka2avro.config.Kafka2AvroConfig
import org.apache.commons.io.output.ByteArrayOutputStream
import org.slf4j.Logger
import pureconfig.error.ConfigReaderFailures
import pureconfig.generic.auto._

object Kafka2AvroUtils {
  /** Returns an object of type T from a base64 encoded string.
    *
    * Overwrite this function for your deserialization code. In this example, we
    * assume that Kafka contains plain old Java objects, encoded as base64
    * strings.
    *
    * @tparam T The type of the object to be recovered
    * @param s String with a base64 encoded serialized object
    */
  def string2Object[T](s: String): T = {
    val data: Array[Byte] = Base64.getDecoder.decode(s)
    val ois: ObjectInputStream = new ObjectInputStream(new ByteArrayInputStream(data))
    val result: T = ois.readObject.asInstanceOf[T]
    ois.close()

    result
  }

  /** Returns a string representation of an object.
    *
    * Overwrite this function with your serialization code. In this example, we
    * serialize the object and transform that into a base64 encoded string,
    * which will be later on written to Kafka.
    *
    * @tparam T The type of the object ot be serialized. The type must be Serializable
    * @param obj The object to be serialized
    */
  def object2String[T](obj: T): String = {
    val bos = new ByteArrayOutputStream()
    val oos = new ObjectOutputStream(bos)
    oos.writeObject(obj)
    oos.close()

    val s: String = Base64.getEncoder.encodeToString(bos.toByteArray)

    s
  }

  /** Try to parse config and run a pipeline.
    *
    * If the configuration is wrong, this function will finish the app with an error message.
    *
    * @param pipeline A function accepting a Kafka2AvroConfig function, that must run the SCIO pipeline.
    * @param logger A logger object for possible errors reading config
    */
  def parseConfigAndRunPipeline(pipeline: Kafka2AvroConfig => Unit, logger: Logger): Unit = {
    val myConfigEither: Either[ConfigReaderFailures, Kafka2AvroConfig] =
      pureconfig.loadConfig[Kafka2AvroConfig]

    myConfigEither match {
      case Left(configErrors: ConfigReaderFailures) =>
        logger.info("The configuration file cannot be parsed.")
        failAndExitWithWrongConfig(configErrors, logger)
      case Right(configOk: Kafka2AvroConfig) =>
        logger.info("Configuration read correctly. Configuration options used in the pipeline: ")
        logger.info(configOk.toString)
        pipeline(configOk)
    }
  }

  /** Writes a error message and some info about wrong configs.
    *
    * If the application.conf file cannot be read correctly (or at all), this
    * function will show a message in stdout with more details about the error.
    *
    * This functions call System.exit(1) to finish the app.
    *
    * @param configErrors Error object returned when reading a wrong configuration.
    * @param l A logger to write a error message to.
    */
  def failAndExitWithWrongConfig(configErrors: ConfigReaderFailures, l: Logger): Unit = {
    val msg: String =
      "Cannot read configuration file or wrong configuration at src/main/resources/application.conf\n" +
      "See below for more details:\n" +
      configErrors.toList.map(_.description).mkString("\n")

    l.error(msg)
    System.exit(1)
  }
}
