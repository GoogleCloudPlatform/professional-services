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

import com.fasterxml.jackson.databind.ObjectMapper;
import io.micronaut.context.ApplicationContext;
import io.micronaut.context.annotation.Requires;
import io.micronaut.http.*;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import io.micronaut.gcp.function.http.*;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.annotation.Produces;
import io.micronaut.runtime.server.EmbeddedServer;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import java.util.List;
import java.util.Map;
import org.example.gcp.bqclaude.client.ClaudeClient;
import org.example.gcp.bqclaude.client.Interactions;

@MicronautTest
public class BqclaudeRemotefunctionFunctionTest {

  @Test
  public void testPost() throws Exception {
    ObjectMapper objectMapper = new ObjectMapper();
    var fakeClaudeServer =
        ApplicationContext.run(
            EmbeddedServer.class,
            Map.of("spec.name", "FakeClaudeTest", "micronaut.server.port", 20001));

    assertTrue(fakeClaudeServer.isRunning());
    assertTrue(fakeClaudeServer.getPort() == 20001);

    try (HttpFunction function = new HttpFunction(); ) {
      var functionRequest =
          new BQClaudeRemoteFunctionController.RemoteFunctionRequest(
              "somereqid", "somecaller", "someprincipal", Map.of(), List.of(List.of("Say hi.")));
      HttpRequest request =
          HttpRequest.POST("/", functionRequest)
              .contentType(MediaType.APPLICATION_JSON_TYPE);
      GoogleHttpResponse response = function.invoke(request);
      assertEquals(HttpStatus.OK, response.getStatus());
      var maybeResponse =
          objectMapper.readValue(
              response.getBodyAsText(), BQClaudeRemoteFunctionController.RemoteFunctionResponse.class);
      assertEquals("hi", maybeResponse.replies().getFirst().content().getFirst().text());
    }
  }

  @Requires(property = "spec.name", value = "FakeClaudeTest")
  @Controller
  static class FakeClaude {

    @Produces(MediaType.APPLICATION_JSON)
    @Post(ClaudeClient.CLAUDE_MESSAGES_PATH)
    Interactions.Body.OK messages() {
      return new Interactions.Body.OK(
          List.of(new Interactions.Body.Content("hi", "text")),
          "some-id",
          "some-model",
          Interactions.Role.USER,
          "",
          "",
          "some-type",
          null);
    }
  }
}
