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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import org.reactivestreams.Publisher;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.client.reactive.ClientHttpRequestDecorator;
import reactor.core.publisher.Mono;

/** */
public class ClaudeVertexAIRequestAdapter extends ClientHttpRequestDecorator {

  private final GoogleAdcProvider credentialsProvider;

  public ClaudeVertexAIRequestAdapter(
      ClientHttpRequest delegate, GoogleAdcProvider credentialsProvider) {
    super(delegate);
    this.credentialsProvider = credentialsProvider;
  }

  @Override
  public Mono<Void> writeWith(Publisher<? extends DataBuffer> originalBody) {
    // Buffer the original body
    return DataBufferUtils.join(originalBody)
        .flatMap(
            dataBuffer -> {
              byte[] bytes = new byte[dataBuffer.readableByteCount()];
              dataBuffer.read(bytes);
              DataBufferUtils.release(dataBuffer);

              try {
                // Modify the JSON
                var mapper = new ObjectMapper();
                var root = (ObjectNode) mapper.readTree(bytes);
                root.put("anthropic_version", "vertex-2023-10-16"); // Add the new property
                root.remove("model"); // remove the non supported property in vertex ai
                byte[] modifiedBytes = mapper.writeValueAsBytes(root);

                // Create a new body publisher with the modified content
                DataBuffer modifiedDataBuffer = new DefaultDataBufferFactory().wrap(modifiedBytes);
                var newBody = Mono.just(modifiedDataBuffer);

                // Set the new content length and authorization headers
                getHeaders().setContentLength(modifiedBytes.length);
                getHeaders().add("Authorization", "Bearer " + credentialsProvider.authTokenValue());

                // Write the modified body to the actual request
                return super.writeWith(newBody);
              } catch (IOException e) {
                // If modification fails, write the original body to avoid breaking the request
                DataBuffer originalDataBuffer = new DefaultDataBufferFactory().wrap(bytes);
                return super.writeWith(Mono.just(originalDataBuffer));
              }
            });
  }
}
