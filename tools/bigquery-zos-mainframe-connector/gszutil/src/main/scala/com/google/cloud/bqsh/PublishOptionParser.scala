/*
 * Copyright 2022 Google LLC All Rights Reserved
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
package com.google.cloud.bqsh

import scopt.OptionParser

object PublishOptionParser extends OptionParser[PublishConfig]("publish") with ArgParser[PublishConfig]{
  override def parse(args: Seq[String], env: Map[String, String]): Option[PublishConfig] =
    parse(args, PublishConfig())

  head("publish", Bqsh.UserAgent)

  help("help")
    .text("prints this usage text")

  arg[String]("topic")
    .required()
    .text("ID of the topic or fully qualified identifier for the topic.")
    .action((x, c) => c.copy(topic = x))

  opt[String]('m', "message")
    .text(
      """The body of the message to publish to the given topic name. Information on message formatting and size limits can be found at: https://cloud.google.com/pubsub/docs/publisher#publish""")
    .action((x, c) => c.copy(message = x))

  opt[Map[String, String]]('a', "attribute")
    .text(
      """Comma-separated list of attributes. Each ATTRIBUTE has the form name="value". You can specify up to 100 attributes.""")
    .action((x, c) => c.copy(attributes = x))

  opt[String]('k', "orderingKey")
    .text(
      """The key for ordering delivery to subscribers. All messages with the same ordering key are sent to subscribers in the order that Pub/Sub receives them.""")
    .action((x, c) => c.copy(orderingKey = x))

}
