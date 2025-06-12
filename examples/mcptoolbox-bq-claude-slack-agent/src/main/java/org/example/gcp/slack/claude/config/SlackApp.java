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
package org.example.gcp.slack.claude.config;

import com.slack.api.bolt.App;
import com.slack.api.bolt.AppConfig;
import com.slack.api.bolt.util.SlackRequestParser;
import com.slack.api.model.event.AppMentionEvent;
import com.slack.api.model.event.MessageChangedEvent;
import com.slack.api.model.event.MessageEvent;
import org.example.gcp.slack.claude.handlers.SlackEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SlackApp {

  @Value("${slack.bot-token}")
  private String botToken;

  @Value("${slack.signing-secret}")
  private String signingSecret;

  @Bean
  public AppConfig loadSingleWorkspaceAppConfig() {
    return AppConfig.builder().singleTeamBotToken(botToken).signingSecret(signingSecret).build();
  }

  @Bean
  public App initSlackApp(AppConfig appConfig, SlackEvent handler) {
    return new App(appConfig)
        .event(AppMentionEvent.class, handler::mention)
        .event(MessageEvent.class, handler::threadMessage)
        .event(MessageChangedEvent.class, handler::threadMessageChange);
  }

  @Bean
  public SlackRequestParser slackRequestParser(AppConfig appConfig) {
    return new SlackRequestParser(appConfig);
  }
}
