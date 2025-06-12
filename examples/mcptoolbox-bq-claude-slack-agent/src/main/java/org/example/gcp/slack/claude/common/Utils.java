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
package org.example.gcp.slack.claude.common;

import com.slack.api.bolt.App;
import com.slack.api.bolt.context.builtin.EventContext;
import com.slack.api.bolt.request.Request;
import com.slack.api.bolt.request.RequestHeaders;
import com.slack.api.bolt.response.Response;
import com.slack.api.bolt.util.SlackRequestParser;
import com.slack.api.methods.SlackApiException;
import com.slack.api.model.event.AppMentionEvent;
import com.slack.api.model.event.Event;
import com.slack.api.model.event.MessageChangedEvent;
import com.slack.api.model.event.MessageEvent;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.server.ServerRequest;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * A collection of static utility methods used throughout the Slack application. This class includes
 * helpers for parsing Slack requests, formatting messages, extracting information from Slack
 * events, and handling errors. It is not meant to be instantiated.
 */
public class Utils {
  private static final Logger LOG = LoggerFactory.getLogger(Utils.class);

  private Utils() {}

  static <K, V> Map<K, List<V>> toMultiMap(MultiValueMap<K, V> multivalueMap) {
    return multivalueMap.entrySet().stream()
        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
  }

  /**
   * Parses an incoming {@link ServerRequest} and its body into a Slack Bolt {@link Request} object.
   *
   * @param requestParser The {@link SlackRequestParser} instance to use for parsing.
   * @param request The incoming HTTP {@link ServerRequest}.
   * @param body The raw request body as a string.
   * @return A Slack Bolt {@link Request} object.
   */
  public static Request<?> parseSlackRequest(
      SlackRequestParser requestParser, ServerRequest request, String body) {
    return requestParser.parse(
        SlackRequestParser.HttpRequest.builder()
            .requestUri(request.requestPath().toString())
            .requestBody(body)
            .queryString(toMultiMap(request.queryParams()))
            .remoteAddress(
                request.headers().header("X-Forwarded-For").stream().findFirst().orElse(""))
            .headers(new RequestHeaders(toMultiMap(request.headers().asHttpHeaders())))
            .build());
  }

  /**
   * Processes a parsed Slack Bolt {@link Request} using the main {@link App} instance. This
   * operation is performed asynchronously.
   *
   * @param slackApp The main Slack Bolt {@link App}.
   * @param slackRequest The parsed Slack {@link Request} to process.
   * @return A {@link Mono} emitting the {@link com.slack.api.bolt.response.Response} from the Bolt
   *     app.
   * @throws RuntimeException if the Bolt app fails to process the request.
   */
  public static Mono<Response> processSlackRequest(App slackApp, Request<?> slackRequest) {
    return Mono.fromCallable(
            () -> {
              try {
                return slackApp.run(slackRequest);
              } catch (Exception ex) {
                throw new RuntimeException("Problems processing slack application request", ex);
              }
            })
        .subscribeOn(Schedulers.boundedElastic());
  }

  /**
   * Sends an error message back to the Slack channel and thread from which an event originated.
   *
   * @param ctx The {@link EventContext} associated with the event.
   * @param event The {@link Event} that caused the error or to which the error refers.
   * @param errorMessage The error message text to send.
   */
  public static void sendErrorToSlack(EventContext ctx, Event event, String errorMessage) {
    try {
      ctx.client()
          .chatPostMessage(
              r -> r.channel(channel(event)).threadTs(threadTs(event)).text(errorMessage));
      LOG.info("Sent error message to Slack: {}", errorMessage);
    } catch (IOException | SlackApiException e) {
      LOG.error("Failed to send error message to Slack: {}", e.getMessage(), e);
    }
  }

  /**
   * Joins a list of lists of strings into a single, continuous string. Useful for concatenating
   * lines of text that might have been buffered.
   *
   * @param bufferedResponses A list where each inner list contains segments of text.
   * @return A single string formed by joining all segments.
   */
  public static String toText(List<List<String>> bufferedResponses) {
    return bufferedResponses.stream().flatMap(List::stream).collect(Collectors.joining());
  }

  /**
   * Removes the first Slack user mention (e.g., "<@U12345>") from the given text and trims
   * leading/trailing whitespace from the result.
   *
   * @param text The input string, potentially containing a Slack user mention.
   * @return The string with the first mention removed, or the original string if no mention is
   *     found.
   */
  public static String removeMention(String text) {
    return text.replaceFirst("<@.*?>", "").trim();
  }

  /**
   * Extracts the correct thread timestamp from a Slack {@link Event}. For {@link AppMentionEvent}
   * and {@link MessageEvent}, it returns the {@code thread_ts} if present, otherwise the event's
   * own {@code ts}. For {@link MessageChangedEvent}, it uses the message's {@code thread_ts} or
   * {@code ts}.
   *
   * @param event The Slack event ({@link AppMentionEvent}, {@link MessageEvent}, or {@link
   *     MessageChangedEvent}).
   * @return The timestamp string to be used for threading replies.
   * @throws IllegalArgumentException if the event type is not supported for thread timestamp
   *     extraction.
   */
  public static String threadTs(Event event) {
    return switch (event) {
      case AppMentionEvent mention ->
          Optional.ofNullable(mention.getThreadTs()).orElse(mention.getTs());
      case MessageEvent message ->
          Optional.ofNullable(message.getThreadTs()).orElse(message.getTs());
      case MessageChangedEvent change ->
          Optional.ofNullable(change.getMessage().getThreadTs())
              .orElse(change.getMessage().getTs());
      default ->
          throw new IllegalArgumentException(
              "Retrieve thread failed. Event type is not supported: " + event.getType());
    };
  }

  /**
   * Extracts the channel ID from a Slack {@link Event}.
   *
   * @param event The Slack event ({@link AppMentionEvent}, {@link MessageEvent}, or {@link
   *     MessageChangedEvent}).
   * @return The channel ID string.
   * @throws IllegalArgumentException if the event type is not supported for channel ID extraction.
   */
  public static String channel(Event event) {
    return switch (event) {
      case AppMentionEvent mention -> mention.getChannel();
      case MessageEvent message -> message.getChannel();
      case MessageChangedEvent change -> change.getChannel();
      default ->
          throw new IllegalArgumentException(
              "Retrieve channel failed. Event type is not supported: " + event.getType());
    };
  }

  /**
   * Converts a Slack message (text content and author) into a Spring AI {@link Message} object. If
   * the {@code userId} matches the {@code botId}, it's considered an {@link AssistantMessage}.
   * Otherwise, it's a {@link UserMessage}.
   *
   * @param userId The ID of the user who sent the message.
   * @param botId The ID of the bot/application.
   * @param text The text content of the message.
   * @return A {@link UserMessage} or {@link AssistantMessage}.
   */
  public static Message toMessage(String userId, String botId, String text) {
    if (userId.equals(botId)) return new AssistantMessage(text);
    return new UserMessage(text);
  }

  static String exceptionMessage(Throwable ex) {
    return Optional.ofNullable(NestedExceptionUtils.getRootCause(ex))
        .map(Throwable::getMessage)
        .orElse(ex.getMessage());
  }

  /**
   * Formats a user-friendly error message string, including a detailed cause from the given {@link
   * Throwable}.
   *
   * @param ex The throwable that occurred.
   * @return A formatted error message string suitable for user display.
   */
  public static String errorMessage(Throwable ex) {
    return """
        Problems executing the task, you can try retrying it.
        Detailed cause:  """
        + exceptionMessage(ex);
  }

  /**
   * Splits a string by newline characters, ensuring that each newline character itself is preserved
   * and is the last character of a string in the resulting list (except possibly the last string in
   * the list if the original text doesn't end with a newline). This is useful for processing text
   * line by line when newlines are significant.
   *
   * @param text The string to be split.
   * @return A list of strings, where each string (except possibly the last) ends with a newline.
   */
  public static List<String> separateNewlines(String text) {
    var delimiter = "<DELIMITER/>";
    return Arrays.asList(text.replace("\n", "\n" + delimiter).split(delimiter));
  }
}
