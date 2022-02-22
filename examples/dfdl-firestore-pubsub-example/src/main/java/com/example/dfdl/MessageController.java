/**
 * Copyright 2022 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.example.dfdl;

import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

/**
 * Publishes message to a topic.
 *
 * <p>Usage: curl --data "message=0000000500779e8c169a54dd0a1b4a3fce2946f6" localhost:8081/publish
 */
@RestController
public class MessageController {

  @Value("${pubsub.message.controller.topic}")
  String pubsubMessageControllerTopic;

  @Autowired private PubSubServer.PubsubOutboundGateway messagingGateway;

  @PostMapping("/publish")
  public RedirectView publishMessage(@RequestParam("message") String message) throws IOException {
    System.out.println(
        "Message being sent for processing to " + pubsubMessageControllerTopic + ":" + message);
    messagingGateway.sendToPubsub(pubsubMessageControllerTopic, message);
    return new RedirectView("/");
  }
}

