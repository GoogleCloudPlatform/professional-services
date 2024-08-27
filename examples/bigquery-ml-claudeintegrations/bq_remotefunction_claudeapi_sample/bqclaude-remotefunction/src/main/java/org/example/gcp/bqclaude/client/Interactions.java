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

package org.example.gcp.bqclaude.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
import io.micronaut.serde.annotation.Serdeable;
import java.util.List;
import java.util.Map;

/**
 * Defines all the types needed to be exchanged with Claude API. Micronaut client will take care of
 * the serialization/deserialization when executing the interactions.
 */
public interface Interactions {

  enum Role {
    USER("user"),
    ASSISTANT("assistant");

    @JsonValue private String value;

    Role(String value) {
      this.value = value;
    }
  }

  @Serdeable
  record ClaudeRequest(
      String model,
      @JsonProperty("max_tokens") int maxTokens,
      List<Message> messages,
      Metadata metadata,
      @JsonProperty("stop_sequences") List<String> stopSequences,
      boolean stream,
      String system,
      double temperature,
      Double topK,
      Double topP) {

    public ClaudeRequest(String model, List<Message> messages, int maxTokens, String systemPrompt) {
      this(model, maxTokens, messages, null, List.of(), false, systemPrompt, 1.0, null, null);
    }

    public static ClaudeRequest parse(
        String model, int maxTokens, String systemPrompt, List<String> params) {
      return new ClaudeRequest(
          model,
          params.stream().map(message -> new Message(Role.USER, message)).toList(),
          maxTokens,
          systemPrompt);
    }
  }

  @Serdeable
  record Message(Role role, String content) {}

  @Serdeable
  record Metadata(@JsonProperty("user_id") String userId) {}

  @Serdeable
  record ClaudeResponse(String tokenId, Body response, Map<String, List<String>> headers) {

    static ClaudeResponse emptyWithHeaders(String tokenId, Map<String, List<String>> headers) {
      return new ClaudeResponse(tokenId, new Body.Empty(), headers);
    }

    public boolean isOk() {
      return switch (this.response()) {
        case Body.Empty __ -> false;
        case Body.Failed __ -> false;
        case Body.RateLimited __ -> false;
        case Body.OK __ -> true;
      };
    }

    public Body.OK okResponse() {
      return (Body.OK) response();
    }
  }

  @Serdeable
  sealed interface Body {

    @Serdeable
    public record Empty() implements Body {}

    @Serdeable
    public record OK(
        List<Content> content,
        String id,
        String model,
        Role role,
        @JsonProperty("stop_reason") String stopReason,
        @JsonProperty("stop_sequence") String stopSequence,
        String type,
        Usage usage)
        implements Body {}

    @Serdeable
    public record Content(String text, String type) {}

    @Serdeable
    public record Usage(
        @JsonProperty("input_tokens") int inputTokens,
        @JsonProperty("output_tokens") int outputTokens) {}

    public record RateLimited() implements Body {
      public static Body create() {
        return new RateLimited();
      }
    }

    @Serdeable
    public record Failed(String type, Detail error) implements Body {}

    @Serdeable
    public record Detail(String type, String message) {}
  }
}
