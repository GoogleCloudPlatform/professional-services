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

import io.modelcontextprotocol.client.McpAsyncClient;
import java.util.List;
import java.util.stream.Stream;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.ai.mcp.AsyncMcpToolCallbackProvider;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Handles interactions with the Claude AI model. This class is responsible for managing the
 * lifecycle of MCP (Model Context Protocol) clients, preparing the chat prompts, and streaming the
 * AI-generated responses.
 */
@Component
public class ClaudeChat {
  private final ChatClient.Builder chatClientBuilder;
  private final ObjectProvider<List<McpAsyncClient>> mcpClientListProvider;
  private final SystemPromptTemplate systemPrompt;

  public ClaudeChat(
      ChatClient.Builder chatClientBuilder,
      ObjectProvider<List<McpAsyncClient>> mcpClientListProvider,
      SystemPromptTemplate systemPrompt) {
    this.chatClientBuilder = chatClientBuilder;
    this.mcpClientListProvider = mcpClientListProvider;
    this.systemPrompt = systemPrompt;
  }

  Mono<List<McpAsyncClient>> prepareClients() {
    return Mono.fromCallable(mcpClientListProvider::getObject);
  }

  Mono<Boolean> cleanup(List<McpAsyncClient> clients) {
    return Mono.fromCallable(
        () -> {
          clients.stream().map(client -> client.closeGracefully()).toList();
          return true;
        });
  }

  /**
   * Generates a response from the Claude AI model based on the given message and message history.
   *
   * <p>Manages the lifecycle of MCP clients for this specific generation request, ensuring they are
   * initialized before use and cleaned up afterwards.
   *
   * @param message The current user message to send to the AI.
   * @param messages A list of previous messages in the conversation history.
   * @return A Flux<String> that streams the AI-generated response content.
   */
  public Flux<String> generate(String message, List<Message> messages) {
    return Flux.usingWhen(
        // McpClients Initialization (resourceAsync)
        prepareClients(),
        // MacpClients usage for Chat client as tools (resourceClosure)
        mcpAsyncClients ->
            this.chatClientBuilder
                .clone()
                .defaultToolCallbacks(new AsyncMcpToolCallbackProvider(mcpAsyncClients))
                .build()
                .prompt(
                    new Prompt(
                        Stream.of(
                                List.<Message>of(new UserMessage(message)),
                                messages,
                                List.of(systemPrompt.createMessage()))
                            .flatMap(List::stream)
                            .toList()))
                .stream()
                .content(),
        // McpClients cleanup (asyncCleanup)
        mcpAsyncClients -> cleanup(mcpAsyncClients));
  }
}
