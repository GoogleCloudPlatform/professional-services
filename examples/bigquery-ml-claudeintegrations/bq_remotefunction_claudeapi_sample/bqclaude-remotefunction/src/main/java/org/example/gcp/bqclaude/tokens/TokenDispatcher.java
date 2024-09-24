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
package org.example.gcp.bqclaude.tokens;

import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.example.gcp.bqclaude.ClaudeConfiguration;
import org.example.gcp.bqclaude.client.Interactions.*;
import org.example.gcp.bqclaude.exceptions.TokenExhaustedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * In charge of keeping track of the available tokens and dispatch them to callers. The tokens
 * associated with the same account, at least in the free tier, would have the same limits applied
 * to them so is better to use tokens from different accounts provisioned for this.
 */
@Singleton
public class TokenDispatcher {

  private static final Logger LOG = LoggerFactory.getLogger(TokenDispatcher.class);
  private static final String CLAUDE_REQUEST_RESET_KEY = "anthropic-ratelimit-requests-reset";
  private static final String CLAUDE_REQUEST_SHOULDRETRY_KEY = "x-should-retry";
  private static final String CLAUDE_REQUEST_RETRYAFTER_KEY = "retry-after";

  @Inject ClaudeConfiguration configuration;

  private Map<String, Token> tokens = new ConcurrentHashMap<>();

  Stream<Token> maybeInit(List<String> configuredTokens) {
    if (tokens.isEmpty()) {
      tokens.putAll(
          configuredTokens.stream()
              .map(token -> new Token.NotInitialized(token))
              .collect(Collectors.toMap(Token::id, Function.identity())));
    }
    return tokens.values().stream();
  }

  public String dispatchToken() {
    return maybeInit(configuration.tokens())
        .filter(t -> decideIfTokenUsable(t))
        .findAny()
        .map(Token::id)
        .orElseThrow(() -> new TokenExhaustedException("No tokens available."));
  }

  public ClaudeResponse informTokenUsage(ClaudeResponse response) {
    var token = Token.captureTokenFromHeaders(response.tokenId(), response.headers());
    LOG.atDebug().log("Token info after request {}", token);
    // update token with most recent known state
    tokens.computeIfPresent(token.id(), (key, tk) -> token);
    if (!decideIfTokenUsable(token) && !response.isOk()) {
      throw new TokenExhaustedException("Token exhausted, retry.");
    }
    return response;
  }

  static boolean decideIfTokenUsable(Token token) {
    return switch (token) {
      case Token.NotInitialized __ -> true;
      case Token.Valid __ -> true;
      case Token.Expired exp when exp.canRetry() -> true;
      default -> false;
    };
  }

  sealed interface Token {

    String id();

    record NotInitialized(String id) implements Token {}

    record Expired(String id, String retryAfterTimestamp) implements Token {
      boolean canRetry() {
        // current time is after the retry after mark from the claude response headers
        return Instant.now().toString().compareTo(retryAfterTimestamp) > 0;
      }
    }

    record Valid(String id) implements Token {}

    static Token captureTokenFromHeaders(String tokenId, Map<String, List<String>> headers) {
      var expired =
          headers.entrySet().stream()
                  .filter(entry -> entry.getKey().equals(CLAUDE_REQUEST_SHOULDRETRY_KEY))
                  .flatMap(entry -> entry.getValue().stream())
                  .map(Boolean::parseBoolean)
                  .anyMatch(should -> should)
              // we want to check on both headers retrying may not be related with token limits
              && headers.containsKey(CLAUDE_REQUEST_RETRYAFTER_KEY);
      return expired
          ? new Token.Expired(
              tokenId,
              headers.get(CLAUDE_REQUEST_RESET_KEY).stream()
                  .findFirst()
                  // shouldn't happend but we assume the reset not being set is because we can use
                  // the token again
                  .orElse(Instant.now().toString()))
          : new Token.Valid(tokenId);
    }
  }
}
