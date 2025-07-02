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
package org.example.gcp.slack.claude.vertexai;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.common.base.Supplier;
import com.google.common.base.Suppliers;
import java.io.IOException;
import java.time.Duration;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.web.reactive.function.client.WebClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;

/** */
@Configuration
@Profile("claude_vertexai")
public class ClaudeVertexAiConfig {

  private static final Logger LOG = LoggerFactory.getLogger(ClaudeVertexAiConfig.class);
  private static final Pattern AI_PLATFORM_PATTERN =
      Pattern.compile("^[a-z0-9-]+-aiplatform\\.googleapis\\.com$");

  @Bean("adcTokenProvider")
  public Supplier<String> adcTokenExpiringSupplier() {
    return Suppliers.<String>memoizeWithExpiration(
        this::applicationDefaultCredentials, Duration.ofMinutes(10));
  }

  @Bean
  public GoogleAdcProvider adcProvider(
      @Qualifier("adcTokenProvider") Supplier<String> adcTokenProvider) {
    return new GoogleAdcProvider(adcTokenProvider);
  }

  @Bean
  public WebClientCustomizer webClientBuilderCustomizer(GoogleAdcProvider credentialsProvider) {
    return builder -> {
      builder.filter(modifyClaudeRequestForVertexAi(credentialsProvider));
    };
  }

  ExchangeFilterFunction modifyClaudeRequestForVertexAi(GoogleAdcProvider credentialsProvider) {
    return (clientRequest, next) -> {
      // Only apply this filter to POST requests with a body sent to vertex ai GCP endpoints
      if (!AI_PLATFORM_PATTERN.matcher(clientRequest.url().getHost()).matches()
          || clientRequest.body() == null
          || !(clientRequest.method().equals(HttpMethod.POST))) {
        return next.exchange(clientRequest);
      }
      return next.exchange(
          ClientRequest.from(clientRequest)
              .body(
                  (outputMessage, context) ->
                      clientRequest
                          .body()
                          .insert(
                              new ClaudeVertexAIRequestAdapter(outputMessage, credentialsProvider),
                              context))
              .build());
    };
  }

  String applicationDefaultCredentials() {
    try {
      return GoogleCredentials.getApplicationDefault().refreshAccessToken().getTokenValue();
    } catch (IOException ex) {
      var msg = "Problems while retrieving default credentials.";
      LOG.error(msg, ex);
      throw new RuntimeException(msg, ex);
    }
  }
}
