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

import static org.example.gcp.slack.claude.common.Utils.parseSlackRequest;
import static org.example.gcp.slack.claude.common.Utils.processSlackRequest;

import com.slack.api.bolt.App;
import com.slack.api.bolt.util.SlackRequestParser;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * Spring WebFlux functional endpoint for handling HTTP requests from Slack. This class receives
 * incoming requests, typically events or interactions from Slack, parses them using {@link
 * SlackRequestParser}, and then dispatches them to the Slack Bolt {@link App} for processing. It
 * then formulates an HTTP response.
 */
@Component
public class SlackResource {
  private final App slackApp;
  private final SlackRequestParser requestParser;

  public SlackResource(App slackApp, SlackRequestParser requestParser) {
    this.slackApp = slackApp;
    this.requestParser = requestParser;
  }

  /**
   * Handles incoming HTTP POST requests from Slack, such as event subscriptions or interactive
   * payloads. The method parses the Slack request, processes it using the Slack Bolt {@link App},
   * and then wraps the Bolt app's response into a {@link ServerResponse}.
   *
   * @param request The incoming {@link ServerRequest} from Slack.
   * @return A {@link Mono} of {@link ServerResponse} to be sent back to Slack. This will typically
   *     be an acknowledgment response. In case of errors during processing, a 500 status response
   *     is returned.
   */
  public Mono<ServerResponse> chatInteraction(ServerRequest request) {
    return request
        .bodyToMono(String.class)
        .flatMap(
            body ->
                processSlackRequest(slackApp, parseSlackRequest(requestParser, request, body))
                    .flatMap(
                        response ->
                            ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(new SlackResponse(response.getBody())))
                    .onErrorResume(
                        ex ->
                            ServerResponse.status(HttpStatusCode.valueOf(500))
                                .bodyValue(new SlackResponse(ex.getMessage()))))
        .switchIfEmpty(ServerResponse.badRequest().build());
  }

  record SlackResponse(String content) {}
}
