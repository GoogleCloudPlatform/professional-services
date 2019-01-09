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

package com.google.cloud.pso.kafka2avro.config

/** The configuration of the Pojo2Avro application
  *
  *  @constructor create a config object
  *  @param broker the Kafka broker address in the form IP:port
  *  @param destBucket the destination Bucket in GCS, without the gs:// prefix
  *  @param destPath the destination path (directories) in the GCS bucket (e.g. a/b/c)
  *  @param kafkaTopic messages will be pulled from this Kafka topic
  *  @param numDemoObjects: number of objects that will be written to Kafka for demo purposes
  */
case class Kafka2AvroConfig(
  broker: String,
  destBucket: String,
  destPath: String,
  kafkaTopic: String,
  numDemoObjects: Int
)
