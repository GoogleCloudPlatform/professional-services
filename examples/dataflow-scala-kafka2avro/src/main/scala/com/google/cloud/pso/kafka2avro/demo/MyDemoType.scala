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

package com.google.cloud.pso.kafka2avro.demo

/** A demo type to showcase the Kafka2Avro pipeline.
  *
  * This is just a demo type showing how you can can read a Scala case class
  * from a string in Kafka, and persist it in Avro format in GCS.
  *
  * Similarly, you could import any type (coming from a Java, Scala, etc,
  * library), and use it with this pipeline. The only requirement is that the
  * type must be serializable.
  *
  * @param name Just a demo property showing how to use Strings.
  * @param version Another demo property
  * @param someProperty Again, another demo property, this time an Integer.
  */
case class MyDemoType(
  name: String,
  version: String,
  someProperty: Int
)
