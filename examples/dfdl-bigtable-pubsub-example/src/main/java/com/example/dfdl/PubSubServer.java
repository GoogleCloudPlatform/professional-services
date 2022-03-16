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

import com.google.cloud.spring.pubsub.core.PubSubTemplate;
import com.google.cloud.spring.pubsub.integration.AckMode;
import com.google.cloud.spring.pubsub.integration.inbound.PubSubInboundChannelAdapter;
import com.google.cloud.spring.pubsub.integration.outbound.PubSubMessageHandler;
import com.google.cloud.spring.pubsub.support.BasicAcknowledgeablePubsubMessage;
import com.google.cloud.spring.pubsub.support.GcpPubSubHeaders;
import java.io.IOException;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.integration.annotation.MessagingGateway;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.util.concurrent.ListenableFutureCallback;

/**
 * Publishes and subscribes to topics using channels adapters.
 *
 * <p>The receiver: - The Inbound Channel Adapter listens to messages from a Google Cloud Pub/Sub
 * subscription and sends them to a Spring channel in an application - The Input Channel receives
 * the message in a Spring Channel - The ServiceActivator processes the received messages in a
 * Spring Channel The sender: - The Message Gateway will write messages to the Spring Channel; - The
 * ServiceActivator will consume the messages in the Spring Channel and sends them to the GCP Topic;
 * - The Output Channel Adapter will ensure that the messages are delivered to the GCP Topic.
 */
@SpringBootApplication
public class PubSubServer {

  private static final Log LOGGER = LogFactory.getLog(PubSubServer.class);

  @Value("${pubsub.data.binary.subscription}")
  String pubsubDataBinarySub;

  @Value("${pubsub.data.json.topic}")
  String pubsubDataJsonTopic;

  @Value("${dfdl.definition.name}")
  String dfdlDefName;

  @Autowired private DfdlService dfdlService;
  @Autowired private BigtableService bigtableService;
  @Autowired private PubsubOutboundGateway messagingGateway;

  /** Returns a channel where the adapter sends the received messages. */
  @Bean
  public MessageChannel inputChannel() {
    return new DirectChannel();
  }

  /**
   * Returns an inbound channel adapter to listen to a subscription and send messages to the input
   * message channel.
   */
  @Bean
  public PubSubInboundChannelAdapter inboundChannelAdapter(
      @Qualifier("inputChannel") MessageChannel messageChannel, PubSubTemplate pubSubTemplate) {
    PubSubInboundChannelAdapter adapter =
        new PubSubInboundChannelAdapter(pubSubTemplate, pubsubDataBinarySub);
    adapter.setOutputChannel(messageChannel);
    adapter.setAckMode(AckMode.MANUAL);
    adapter.setPayloadType(String.class);
    return adapter;
  }

  /**
   * Processes the received message in a spring channel. The received message is the one to be
   * interpreted or transform using the dfdl definition and be republished in a new topic.
   */
  @Bean
  @ServiceActivator(inputChannel = "inputChannel")
  public MessageHandler messageReceiver() {
    return message -> {
      LOGGER.info("Message arrived! Payload: " + message.getPayload());
      DfdlDef dfdlDef;
      try {
        // Get DFDL Definition from Bigtable.
        dfdlDef = bigtableService.getDfdlDef(dfdlDefName);
        System.out.println("Definition from Bigtable: " + dfdlDef.getDefinition());

        // Transform message using the dfdl definition.
        String messageConverted =
            dfdlService.convertDataMessage((String) message.getPayload(), dfdlDef);

        // Republish the message in json format in a new topic
        messagingGateway.sendToPubsub(pubsubDataJsonTopic, messageConverted);

      } catch (IOException e) {
        e.printStackTrace();
      }
      BasicAcknowledgeablePubsubMessage originalMessage =
          message
              .getHeaders()
              .get(GcpPubSubHeaders.ORIGINAL_MESSAGE, BasicAcknowledgeablePubsubMessage.class);
      originalMessage.ack();
    };
  }

  /**
   * Listens to messages on the spring channel amd publishes then to the outbound channel adapter
   * which will deliver the message to the GCP topic.
   *
   * @return PubSubMessageHandler adapter.
   */
  @Bean
  @ServiceActivator(inputChannel = "outputChannel")
  public MessageHandler messageSender(PubSubTemplate pubsubTemplate) {
    PubSubMessageHandler adapter = new PubSubMessageHandler(pubsubTemplate, GcpPubSubHeaders.TOPIC);
    adapter.setPublishCallback(
        new ListenableFutureCallback<String>() {
          @Override
          public void onFailure(Throwable throwable) {
            LOGGER.info("There was an error sending the message.");
          }

          @Override
          public void onSuccess(String result) {
            LOGGER.info("Message was sent via the outbound channel adapter to a topic ");
          }
        });
    return adapter;
  }

  /** Allows publishing messages to the spring output channel. */
  @MessagingGateway(defaultRequestChannel = "outputChannel")
  public interface PubsubOutboundGateway {
    void sendToPubsub(@Header(GcpPubSubHeaders.TOPIC) String topic, String message);
  }
}
