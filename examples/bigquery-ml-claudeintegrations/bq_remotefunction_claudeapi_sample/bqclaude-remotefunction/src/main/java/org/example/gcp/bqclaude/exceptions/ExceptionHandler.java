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

package org.example.gcp.bqclaude.exceptions;

import io.micronaut.context.annotation.Requires;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.HttpStatus;
import io.micronaut.http.annotation.Produces;
import jakarta.inject.Singleton;

/**
 * Translates those errors related with rate limiting, encountered on a Claude API interaction, into
 * 429 responses so the caller can back off an retry in a while. This solution should internally
 * manage backoffs and retries but in the case of all of those being exhausted we need to propagate
 * to the caller.
 */
@Produces
@Singleton
@Requires(classes = {TokenExhaustedException.class})
public class ExceptionHandler
    implements io.micronaut.http.server.exceptions.ExceptionHandler<
        TokenExhaustedException, HttpResponse> {

  @Override
  public HttpResponse handle(HttpRequest request, TokenExhaustedException exception) {
    return HttpResponse.status(HttpStatus.TOO_MANY_REQUESTS);
  }
}
