/*
 * Copyright 2024 Google.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.example.gcp.bqclaude;

import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Post;
import org.example.gcp.bqclaude.client.ClaudeClient;
import io.micronaut.serde.annotation.Serdeable;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.example.gcp.bqclaude.client.Interactions.ClaudeRequest;
import org.example.gcp.bqclaude.client.Interactions.ClaudeResponse;
import org.example.gcp.bqclaude.client.Interactions.Body.OK;

/**
 * This controller acts as the entry point of the remote function logic. Micronaut will take part on
 * translating the requests and responses handled here into the Cloud Function environment entry
 * point.
 */
@Controller("/")
public class BQClaudeRemoteFunctionController {

  @Inject ClaudeClient claudeClient;
  @Inject ClaudeConfiguration configuration;

  @Post
  public RemoteFunctionResponse postMethod(@Body RemoteFunctionRequest request) {
    var calls = Optional.ofNullable(request.calls()).orElse(List.of());
    var responses =
        calls.stream()
            .map(
                call ->
                    ClaudeRequest.parse(
                        configuration.model(),
                        request.getMaxTokens(),
                        request.getSystemPrompt(),
                        call))
            .map(claudeRequest -> claudeClient.sendMessageWithRetries(claudeRequest))
            .collect(Collectors.groupingBy(response -> response.isOk()));
    // check if we got any errors
    return responses.getOrDefault(false, List.of()).isEmpty()
        ? RemoteFunctionResponse.OK(
            responses.getOrDefault(true, List.of()).stream()
                .map(ClaudeResponse::okResponse)
                .toList())
        : RemoteFunctionResponse.Error(
            "Errors ocurred in the interaction with claude: \n"
                + responses.getOrDefault(false, List.of()).stream()
                    .map(ClaudeResponse::toString)
                    .toString());
  }

  @Serdeable
  public record RemoteFunctionRequest(
      String requestId,
      String caller,
      String sessionUser,
      Map<String, String> userDefinedContext,
      List<List<String>> calls) {

    int getMaxTokens() {
      return Integer.parseInt(
          Optional.ofNullable(userDefinedContext)
              .orElse(Map.of())
              .getOrDefault("max-tokens", "1024"));
    }

    String getSystemPrompt() {
      return Optional.ofNullable(userDefinedContext)
          .orElse(Map.of())
          .getOrDefault("system-prompt", "");
    }
  }

  @Serdeable
  public record RemoteFunctionResponse(List<OK> replies, String errorMessage) {

    static RemoteFunctionResponse OK(List<OK> replies) {
      return new RemoteFunctionResponse(replies, null);
    }

    static RemoteFunctionResponse Error(String errorMessage) {
      return new RemoteFunctionResponse(null, errorMessage);
    }
  }
}
