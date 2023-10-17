/*
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.sts;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.http.HttpBackOffIOExceptionHandler;
import com.google.api.client.http.HttpBackOffUnsuccessfulResponseHandler;
import com.google.api.client.http.HttpBackOffUnsuccessfulResponseHandler.BackOffRequired;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpResponse;
import com.google.api.client.http.HttpUnsuccessfulResponseHandler;
import com.google.api.client.util.ExponentialBackOff;
import com.google.api.client.util.Sleeper;
import com.google.common.base.Preconditions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * RetryHttpInitializerWrapper will automatically retry upon RPC failures, preserving the
 * auto-refresh behavior of the Google Credentials.
 */
public class RetryHttpInitializerWrapper implements HttpRequestInitializer {

  private static final Logger logger = LoggerFactory.getLogger(RetryHttpInitializerWrapper.class);
  private final Credential wrappedCredential;
  private final Sleeper sleeper;
  private boolean backOffRequiredRateLimit;
  private static final int MILLIS_PER_MINUTE = 60 * 1000;
  public static final int TOO_MANY_REQUESTS_429 = 429;

  /**
   * A constructor using the default Sleeper.
   *
   * @param wrappedCredential the credential used to authenticate with a Google Cloud Platform
   *     project
   */
  public RetryHttpInitializerWrapper(Credential wrappedCredential) {
    this(wrappedCredential, Sleeper.DEFAULT, false);
  }

  /**
   * A constructor used only for testing.
   *
   * @param wrappedCredential the credential used to authenticate with a Google Cloud Platform
   *     project
   * @param sleeper a user-supplied Sleeper
   */
  RetryHttpInitializerWrapper(
      Credential wrappedCredential, Sleeper sleeper, boolean backOffRequiredRateLimit) {
    this.wrappedCredential = Preconditions.checkNotNull(wrappedCredential);
    this.sleeper = sleeper;
    this.backOffRequiredRateLimit = backOffRequiredRateLimit;
  }

  /**
   * A constructor using default Sleeper and allow back off retry setting
   *
   * @param wrappedCredential the credential used to authenticate with a Google Cloud Platform
   *     project
   * @param backOffRequiredRateLimit whether or not exponential backoff retry is for server error or
   *     server error plugs rate limit error only
   */
  public RetryHttpInitializerWrapper(
      Credential wrappedCredential, boolean backOffRequiredRateLimit) {
    this(wrappedCredential, Sleeper.DEFAULT, backOffRequiredRateLimit);
  }

  /**
   * Initialize an HttpRequest.
   *
   * @param request an HttpRequest that should be initialized
   */
  public void initialize(HttpRequest request) {
    request.setReadTimeout(2 * MILLIS_PER_MINUTE); // 2 minutes read timeout
    final HttpUnsuccessfulResponseHandler backoffHandler =
        new HttpBackOffUnsuccessfulResponseHandler(new ExponentialBackOff()).setSleeper(sleeper);
    if (backOffRequiredRateLimit) {
      ((HttpBackOffUnsuccessfulResponseHandler) backoffHandler)
          .setBackOffRequired(SdrsBackOffRequired.ON_SERVER_ERROR_RATE_LIMIT);
    }
    request.setInterceptor(wrappedCredential);
    request.setUnsuccessfulResponseHandler(
        (final HttpRequest unsuccessfulRequest,
            final HttpResponse response,
            final boolean supportsRetry) -> {
          if (wrappedCredential.handleResponse(unsuccessfulRequest, response, supportsRetry)) {
            // If credential decides it can handle it, the return code or message indicated
            // something specific to authentication, and no backoff is desired.
            return true;
          } else if (backoffHandler.handleResponse(unsuccessfulRequest, response, supportsRetry)) {
            // Otherwise, we defer to the judgement of our internal backoff handler.
            logger.info("Retrying " + unsuccessfulRequest.getUrl().toString());
            return true;
          } else {
            return false;
          }
        });

    request.setIOExceptionHandler(
        new HttpBackOffIOExceptionHandler(new ExponentialBackOff()).setSleeper(sleeper));
  }

  public interface SdrsBackOffRequired extends BackOffRequired {
    HttpBackOffUnsuccessfulResponseHandler.BackOffRequired ON_SERVER_ERROR_RATE_LIMIT =
        response ->
            response.getStatusCode() / 100 == 5
                || response.getStatusCode() == TOO_MANY_REQUESTS_429;
  }
}
