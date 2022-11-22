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
package com.google.cloud.bqsh.cmd

import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.services.pubsub.model.{PublishRequest, PubsubMessage}
import com.google.cloud.bqsh.{ArgParser, Command, PublishConfig, PublishOptionParser}
import com.google.cloud.imf.gzos.MVS
import com.google.cloud.imf.util.{Logging, Services}

import java.nio.charset.StandardCharsets
import java.util.Base64
import scala.jdk.CollectionConverters.{MapHasAsJava, SeqHasAsJava}

object Publish extends Command[PublishConfig] with Logging {
  override val name: String = "publish"
  override val parser: ArgParser[PublishConfig] = PublishOptionParser

  override def run(config: PublishConfig, zos: MVS, env: Map[String, String]): Result = {
    val pubsub = Services.pubsub(Services.pubsubCredentials())

    val message = new PubsubMessage()
      .setData(new String(Base64.getEncoder.encode(config.message.getBytes(StandardCharsets.UTF_8))))
      .setAttributes(config.attributes.asJava)

    if (config.orderingKey.nonEmpty)
      message.setOrderingKey(config.orderingKey)

    val content = new PublishRequest()
      .setMessages((message::Nil).asJava)
    val response = pubsub.projects().topics().publish(config.topic, content).execute()
    System.out.println("PublishResponse:")
    System.out.println(JacksonFactory.getDefaultInstance.toPrettyString(response))
    Result.Success
  }
}
