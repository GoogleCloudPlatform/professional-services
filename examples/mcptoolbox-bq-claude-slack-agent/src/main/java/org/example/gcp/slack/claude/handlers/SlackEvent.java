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

import static org.example.gcp.slack.claude.common.Utils.errorMessage;
import static org.example.gcp.slack.claude.common.Utils.removeMention;
import static org.example.gcp.slack.claude.common.Utils.sendErrorToSlack;
import static org.example.gcp.slack.claude.common.Utils.separateNewlines;
import static org.example.gcp.slack.claude.common.Utils.threadTs;
import static org.example.gcp.slack.claude.common.Utils.toText;

import com.slack.api.app_backend.events.payload.EventsApiPayload;
import com.slack.api.bolt.context.builtin.EventContext;
import com.slack.api.bolt.response.Response;
import com.slack.api.model.event.AppMentionEvent;
import com.slack.api.model.event.Event;
import com.slack.api.model.event.MessageChangedEvent;
import com.slack.api.model.event.MessageEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

/**
 * Handles incoming Slack events such as app mentions and messages in threads. This class processes
 * these events, interacts with {@link ClaudeChat} to get AI-generated responses, and uses {@link
 * SlackOperations} to send replies back to the appropriate Slack channel and thread.
 */
@Component
public class SlackEvent {
  private static final Logger LOG = LoggerFactory.getLogger(SlackEvent.class);

  private final ClaudeChat claude;
  private final SlackOperations slack;
  private final Integer groupedLinesCount;

  public SlackEvent(
      ClaudeChat claude,
      SlackOperations send,
      @Value("${slack.grouped-lines-count}") Integer lines) {
    this.claude = claude;
    this.slack = send;
    this.groupedLinesCount = lines;
  }

  /**
   * Handles an 'app_mention' event from Slack. This is triggered when the application is mentioned
   * directly in a channel. It processes the message and sends a reply back to the same thread.
   *
   * @param payload The Slack event payload for an app mention.
   * @param ctx The event context provided by Slack Bolt.
   * @return A response acknowledging the event.
   */
  public Response mention(EventsApiPayload<AppMentionEvent> payload, EventContext ctx) {
    var event = payload.getEvent();
    process(ctx, event, event.getChannel(), threadTs(event), removeMention(event.getText()));
    return ctx.ack();
  }

  /**
   * Handles a 'message' event within a thread from Slack. This is triggered when a new message is
   * posted in a thread where the app is involved. It processes the message and sends a reply back
   * to the same thread.
   *
   * @param payload The Slack event payload for a message event.
   * @param ctx The event context provided by Slack Bolt.
   * @return A response acknowledging the event.
   */
  public Response threadMessage(EventsApiPayload<MessageEvent> payload, EventContext ctx) {
    var event = payload.getEvent();
    if (event.getThreadTs() != null) {
      process(ctx, event, event.getChannel(), event.getThreadTs(), event.getText());
    }
    return ctx.ack();
  }

  /**
   * Handles a 'message_changed' event within a thread from Slack. This is triggered when a message
   * in a thread where the app is involved is edited. It processes the updated message and sends a
   * reply back to the same thread.
   *
   * @param payload The Slack event payload for a message changed event.
   * @param ctx The event context provided by Slack Bolt.
   * @return A response acknowledging the event.
   */
  public Response threadMessageChange(
      EventsApiPayload<MessageChangedEvent> payload, EventContext ctx) {
    var event = payload.getEvent();
    var message = event.getMessage();
    if (message.getThreadTs() != null) {
      process(ctx, event, event.getChannel(), message.getThreadTs(), message.getText());
    }
    return ctx.ack();
  }

  /**
   * Core processing logic for handling an incoming message event. This method fetches the previous
   * messages in the thread from Slack, then calls {@link ClaudeChat#generate(String, List)} to get
   * an AI response. The response, which is a stream of text, is then formatted and sent as one or
   * more reply messages back to the originating Slack thread using {@link
   * SlackOperations#reply(EventContext, Event, String)}. Errors during the process are caught and
   * reported to Slack.
   *
   * @param ctx The Slack event context.
   * @param event The original Slack event (mention or message).
   * @param channelId The ID of the channel where the event occurred.
   * @param threadTs The timestamp of the thread to reply to.
   * @param message The text of the message to process.
   */
  void process(EventContext ctx, Event event, String channelId, String threadTs, String message) {
    slack
        .history(ctx, channelId, threadTs)
        .flatMapMany(previousMessages -> claude.generate(message, previousMessages))
        // llm generates a text stream, and we want to iterate through the lines
        .flatMap(text -> Flux.fromIterable(separateNewlines(text)))
        // we will be buffering text until we find a newline char
        .bufferUntil(text -> text.endsWith("\n"))
        // remove all empty lines
        .filter(words -> words.size() > 1 || !words.stream().findFirst().orElse("").isBlank())
        // buffer again to condense more text to be sent to Slack at a time
        .buffer(groupedLinesCount)
        .flatMap(textResponse -> slack.reply(ctx, event, toText(textResponse)).flux())
        .subscribe(
            __ -> LOG.debug("Line sent to Slack thread."),
            ex -> sendErrorToSlack(ctx, event, errorMessage(ex)),
            () -> LOG.info("All messages sent"));
  }
}
