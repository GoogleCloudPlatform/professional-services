/*
 * Copyright (C) 2025 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package org.example.gcp.slack.claude.handlers;

import static org.example.gcp.slack.claude.common.Utils.channel;
import static org.example.gcp.slack.claude.common.Utils.removeMention;
import static org.example.gcp.slack.claude.common.Utils.threadTs;
import static org.example.gcp.slack.claude.common.Utils.toMessage;

import com.slack.api.bolt.context.builtin.EventContext;
import com.slack.api.methods.SlackApiException;
import com.slack.api.model.event.Event;
import java.io.IOException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.Message;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * Provides methods for interacting with the Slack API. This class handles operations like sending
 * messages to Slack channels/threads and retrieving conversation history. All operations are
 * performed asynchronously.
 */
@Component
public class SlackOperations {
  private static final Logger LOG = LoggerFactory.getLogger(SlackOperations.class);

  /**
   * Sends a reply message to the Slack thread from which an event originated.
   *
   * @param ctx The Slack event context, used for accessing the Slack client.
   * @param event The original event that triggered the reply. Used to determine the channel and
   *     thread.
   * @param textToSend The text message to send as a reply.
   * @return A {@link Mono} emitting {@code true} if the message was posted successfully, or an
   *     error if posting failed.
   */
  public Mono<Boolean> reply(EventContext ctx, Event event, String textToSend) {
    return Mono.fromCallable(
            () -> {
              try {
                var post =
                    ctx.client()
                        .chatPostMessage(
                            r ->
                                r.channel(channel(event))
                                    .threadTs(threadTs(event))
                                    .text(textToSend));
                if (!post.isOk()) {
                  throw new RuntimeException("Problems posting a reply: " + post.getError());
                }
                return true;
              } catch (IOException | SlackApiException e) {
                var msg = String.format("Error sending Slack response: %s", e.getMessage());
                LOG.error(msg, e);
                throw new RuntimeException(msg, e);
              }
            })
        .subscribeOn(Schedulers.boundedElastic());
  }

  /**
   * Retrieves the message history from a specific Slack channel and thread. The messages are
   * converted into a list of Spring AI {@link Message} objects.
   *
   * @param ctx The Slack event context, used for accessing the Slack client and bot user ID.
   * @param channelId The ID of the Slack channel.
   * @param threadId The timestamp (ts) of the parent message in the thread.
   * @return A {@link Mono} emitting a list of {@link Message} objects representing the conversation
   *     history, or an error if history retrieval failed.
   */
  public Mono<List<Message>> history(EventContext ctx, String channelId, String threadId) {
    return Mono.fromCallable(
            () -> {
              try {
                var history =
                    ctx.client()
                        .conversationsReplies(
                            cr -> cr.channel(channelId).ts(threadId).token(ctx.getBotToken()));
                if (history.isOk()) {
                  return history.getMessages().stream()
                      .map(
                          msg ->
                              toMessage(
                                  msg.getUser(), ctx.getBotUserId(), removeMention(msg.getText())))
                      .distinct()
                      .toList();
                }
                throw new RuntimeException("Error retrieving history: " + history.getError());
              } catch (SlackApiException | IOException ex) {
                throw new RuntimeException("Error retrieving history: ", ex);
              }
            })
        .subscribeOn(Schedulers.boundedElastic());
  }
}
