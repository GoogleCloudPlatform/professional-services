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
 * Usage: curl --data "message=0000000500779e8c169a54dd0a1b4a3fce2946f6" localhost:8081/publish
 */
@RestController
public class MessageController {

  @Autowired
  private PubSubServer.PubsubOutboundGateway messagingGateway;

  @Value("${pubsub.message.controller.topic}") String pubsubMessageControllerTopic;

  @PostMapping("/publish")
  public RedirectView publishMessage(@RequestParam("message") String message)
      throws IOException {
    System.out.println("Message being sent for processing to "
        + pubsubMessageControllerTopic
        + ":" + message);
    messagingGateway.sendToPubsub(pubsubMessageControllerTopic, message);
    return new RedirectView("/");
  }
}